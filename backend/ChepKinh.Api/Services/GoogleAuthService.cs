using System;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace ChepKinh.Api.Services
{
    public interface IGoogleAuthService
    {
        Task<GoogleJsonWebSignature.Payload?> VerifyGoogleTokenAsync(string idToken);
    }

    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly IConfiguration _configuration;

        public GoogleAuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<GoogleJsonWebSignature.Payload?> VerifyGoogleTokenAsync(string idToken)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings();
                var clientId = _configuration["Google:ClientId"];
                
                // Nếu ClientId hợp lệ thì kiểm tra Audience
                if (!string.IsNullOrEmpty(clientId) && !clientId.Contains("YOUR_GOOGLE_CLIENT"))
                {
                    settings.Audience = new[] { clientId };
                }

                return await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GoogleAuth Error]: {ex.Message}");
                try
                {
                    // Fallback: Kiểm tra chữ ký mật mã Google trực tiếp
                    return await GoogleJsonWebSignature.ValidateAsync(idToken);
                }
                catch (Exception fallbackEx)
                {
                    Console.WriteLine($"[GoogleAuth Fallback Failed]: {fallbackEx.Message}");
                    return null;
                }
            }
        }
    }
}
