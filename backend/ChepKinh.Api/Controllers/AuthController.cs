using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChepKinh.Api.Data;
using ChepKinh.Api.DTOs;
using ChepKinh.Api.Models;
using ChepKinh.Api.Services;

namespace ChepKinh.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IGoogleAuthService _googleAuthService;

        public AuthController(ApplicationDbContext context, IJwtService jwtService, IGoogleAuthService googleAuthService)
        {
            _context = context;
            _jwtService = jwtService;
            _googleAuthService = googleAuthService;
        }

        [HttpPost("google-login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.IdToken))
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("IdToken không được để trống."));
            }

            var (payload, errorMessage) = await _googleAuthService.VerifyGoogleTokenWithDetailsAsync(dto.IdToken);
            if (payload == null)
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail($"Xác thực Google không thành công: {errorMessage}"));
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    GoogleId = payload.Subject,
                    Email = payload.Email,
                    FullName = payload.Name ?? payload.Email.Split('@')[0],
                    AvatarUrl = payload.Picture,
                    UserType = "User",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "USER");
                if (userRole != null)
                {
                    _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = userRole.Id });
                    await _context.SaveChangesAsync();
                }

                user = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                    .ThenInclude(rp => rp.Permission)
                    .FirstAsync(u => u.Id == user.Id);
            }

            if (!user.IsActive)
            {
                return StatusCode(403, ApiResponse<AuthResponseDto>.Fail("Tài khoản của bạn đã bị tạm khóa."));
            }

            var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.PermissionCode)
                .Distinct()
                .ToList();

            var accessToken = _jwtService.GenerateAccessToken(user, roles, permissions);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(90); // 90 ngày duy trì đăng nhập
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    UserType = user.UserType,
                    Roles = roles,
                    Permissions = permissions
                }
            }, "Đăng nhập Google thành công."));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Họ tên, email và mật khẩu không được để trống."));
            }

            if (dto.Password.Length < 6)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Mật khẩu phải có ít nhất 6 ký tự."));
            }

            var existingUser = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
            if (existingUser)
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Email này đã được đăng ký trong hệ thống."));
            }

            var user = new User
            {
                Email = dto.Email.Trim().ToLower(),
                FullName = dto.FullName.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                UserType = "User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "USER");
            if (userRole != null)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = userRole.Id });
                await _context.SaveChangesAsync();
            }

            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstAsync(u => u.Id == user.Id);

            var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.PermissionCode)
                .Distinct()
                .ToList();

            var accessToken = _jwtService.GenerateAccessToken(user, roles, permissions);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(90);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    UserType = user.UserType,
                    Roles = roles,
                    Permissions = permissions
                }
            }, "Đăng ký tài khoản thành công."));
        }

        [HttpPost("user-login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> UserLogin([FromBody] UserLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(ApiResponse<AuthResponseDto>.Fail("Email và mật khẩu không được để trống."));
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());

            if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Email hoặc mật khẩu không chính xác."));
            }

            if (!user.IsActive)
            {
                return StatusCode(403, ApiResponse<AuthResponseDto>.Fail("Tài khoản của bạn đã bị tạm khóa."));
            }

            var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.PermissionCode)
                .Distinct()
                .ToList();

            var accessToken = _jwtService.GenerateAccessToken(user, roles, permissions);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(90);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    UserType = user.UserType,
                    Roles = roles,
                    Permissions = permissions
                }
            }, "Đăng nhập thành công."));
        }

        [HttpPost("admin-login")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> AdminLogin([FromBody] AdminLoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.UserType == "Admin");

            if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Email hoặc mật khẩu quản trị không chính xác."));
            }

            if (!user.IsActive)
            {
                return StatusCode(403, ApiResponse<AuthResponseDto>.Fail("Tài khoản quản trị đã bị vô hiệu hóa."));
            }

            var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.PermissionCode)
                .Distinct()
                .ToList();

            var accessToken = _jwtService.GenerateAccessToken(user, roles, permissions);
            var refreshToken = _jwtService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(90);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    UserType = user.UserType,
                    Roles = roles,
                    Permissions = permissions
                }
            }, "Đăng nhập quản trị thành công."));
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RefreshToken))
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Refresh Token không hợp lệ."));
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.RefreshToken == dto.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."));
            }

            if (!user.IsActive)
            {
                return StatusCode(403, ApiResponse<AuthResponseDto>.Fail("Tài khoản của bạn đã bị tạm khóa."));
            }

            var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.PermissionCode)
                .Distinct()
                .ToList();

            var newAccessToken = _jwtService.GenerateAccessToken(user, roles, permissions);
            var newRefreshToken = _jwtService.GenerateRefreshToken();

            // Sliding Expiration: Gia hạn thêm 90 ngày
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(90);
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    AvatarUrl = user.AvatarUrl,
                    UserType = user.UserType,
                    Roles = roles,
                    Permissions = permissions
                }
            }, "Làm mới phiên đăng nhập thành công."));
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<bool>>> Logout()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(userIdStr, out var userId))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user != null)
                {
                    user.RefreshToken = null;
                    user.RefreshTokenExpiryTime = null;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(ApiResponse<bool>.Ok(true, "Đăng xuất thành công."));
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<ApiResponse<UserInfoDto>>> GetCurrentUser()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(userIdStr, out var userId))
            {
                return Unauthorized(ApiResponse<UserInfoDto>.Fail("Không xác định được danh tính."));
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound(ApiResponse<UserInfoDto>.Fail("Người dùng không tồn tại."));

            var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToList();
            var permissions = user.UserRoles
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.PermissionCode)
                .Distinct()
                .ToList();

            return Ok(ApiResponse<UserInfoDto>.Ok(new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                UserType = user.UserType,
                Roles = roles,
                Permissions = permissions
            }));
        }
    }
}
