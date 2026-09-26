using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ChepKinh.Api.DTOs;
using ChepKinh.Api.Services;

namespace ChepKinh.Api.Controllers
{
    [ApiController]
    [Route("api/admin/sutras")]
    [Authorize(Roles = "ADMIN")]
    public class AdminSutrasController : ControllerBase
    {
        private readonly ISutraService _sutraService;
        private readonly IPdfExtractionService _pdfExtractionService;

        public AdminSutrasController(ISutraService sutraService, IPdfExtractionService pdfExtractionService)
        {
            _sutraService = sutraService;
            _pdfExtractionService = pdfExtractionService;
        }

        private long GetAdminId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(idStr, out var id))
            {
                throw new UnauthorizedAccessException("Không xác định được danh tính quản trị viên.");
            }
            return id;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PagedResult<SutraListDto>>>> GetAllSutras(
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? keyword = null,
            CancellationToken ct = default)
        {
            var result = await _sutraService.GetAllSutrasAdminAsync(pageIndex, pageSize, keyword, ct);
            return Ok(ApiResponse<PagedResult<SutraListDto>>.Ok(result));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<SutraDetailDto>>> GetSutraDetail(int id, CancellationToken ct = default)
        {
            var sutra = await _sutraService.GetSutraDetailAsync(id, ct);
            if (sutra == null) return NotFound(ApiResponse<SutraDetailDto>.Fail("Không tìm thấy bộ kinh."));
            return Ok(ApiResponse<SutraDetailDto>.Ok(sutra));
        }

        [HttpPost("extract-pdf")]
        [RequestSizeLimit(30_000_000)] // 30MB max
        public async Task<ActionResult<ApiResponse<ExtractedPdfResultDto>>> ExtractPdf(
            IFormFile file,
            [FromForm] string scriptType = "QUOC_NGU")
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<ExtractedPdfResultDto>.Fail("Vui lòng chọn tệp PDF hợp lệ."));
            }

            if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(ApiResponse<ExtractedPdfResultDto>.Fail("Tệp tải lên phải có định dạng .pdf."));
            }

            using var stream = file.OpenReadStream();
            var result = await _pdfExtractionService.ExtractTextFromPdfAsync(stream, file.FileName, scriptType);

            return Ok(ApiResponse<ExtractedPdfResultDto>.Ok(result, "Trích xuất văn bản từ PDF thành công."));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<SutraDetailDto>>> CreateSutra([FromBody] CreateSutraDto dto, CancellationToken ct)
        {
            var adminId = GetAdminId();
            var result = await _sutraService.CreateSutraAsync(dto, adminId, ct);
            return Ok(ApiResponse<SutraDetailDto>.Ok(result, "Tạo và dàn trang bộ kinh mới thành công."));
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<SutraDetailDto>>> UpdateSutra(int id, [FromBody] CreateSutraDto dto, CancellationToken ct)
        {
            var result = await _sutraService.UpdateSutraAsync(id, dto, ct);
            if (result == null) return NotFound(ApiResponse<SutraDetailDto>.Fail("Không tìm thấy bộ kinh cần sửa."));
            return Ok(ApiResponse<SutraDetailDto>.Ok(result, "Cập nhật bộ kinh thành công."));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteSutra(int id, CancellationToken ct)
        {
            var success = await _sutraService.DeleteSutraAsync(id, ct);
            if (!success) return NotFound(ApiResponse<bool>.Fail("Không tìm thấy bộ kinh cần xóa."));
            return Ok(ApiResponse<bool>.Ok(true, "Xóa bộ kinh thành công."));
        }

        [HttpPost("{id}/toggle-publish")]
        public async Task<ActionResult<ApiResponse<bool>>> TogglePublish(int id, CancellationToken ct)
        {
            var success = await _sutraService.TogglePublishAsync(id, ct);
            if (!success) return NotFound(ApiResponse<bool>.Fail("Không tìm thấy bộ kinh."));
            return Ok(ApiResponse<bool>.Ok(true, "Thay đổi trạng thái xuất bản thành công."));
        }
    }
}
