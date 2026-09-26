using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChepKinh.Api.DTOs;
using ChepKinh.Api.Services;

namespace ChepKinh.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SutrasController : ControllerBase
    {
        private readonly ISutraService _sutraService;

        public SutrasController(ISutraService sutraService)
        {
            _sutraService = sutraService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<PagedResult<SutraListDto>>>> GetPublishedSutras(
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 12,
            [FromQuery] string? keyword = null,
            CancellationToken ct = default)
        {
            var result = await _sutraService.GetPublishedSutrasAsync(pageIndex, pageSize, keyword, ct);
            return Ok(ApiResponse<PagedResult<SutraListDto>>.Ok(result));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<SutraDetailDto>>> GetSutraDetail(int id, CancellationToken ct = default)
        {
            var sutra = await _sutraService.GetSutraDetailAsync(id, ct);
            if (sutra == null) return NotFound(ApiResponse<SutraDetailDto>.Fail("Không tìm thấy bộ kinh."));
            return Ok(ApiResponse<SutraDetailDto>.Ok(sutra));
        }

        [HttpGet("{id}/pages/{pageNumber}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<SutraPageDto>>> GetSutraPage(int id, int pageNumber, CancellationToken ct = default)
        {
            var page = await _sutraService.GetSutraPageAsync(id, pageNumber, ct);
            if (page == null) return NotFound(ApiResponse<SutraPageDto>.Fail("Không tìm thấy trang kinh."));
            return Ok(ApiResponse<SutraPageDto>.Ok(page));
        }
    }
}
