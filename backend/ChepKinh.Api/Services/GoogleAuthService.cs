using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;

namespace ChepKinh.Api.Services
{
    public class GoogleUserPayload
    {
        public string Subject { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Picture { get; set; }
        public string? Audience { get; set; }
    }

    public interface IGoogleAuthService
    {
        Task<(GoogleUserPayload? payload, string? error)> VerifyGoogleTokenWithDetailsAsync(string idToken);
        Task<GoogleUserPayload?> VerifyGoogleTokenAsync(string idToken);
    }

    public class GoogleAuthService : IGoogleAuthService
    {
        private readonly IConfiguration _configuration;
        private static readonly HttpClient _httpClient = new HttpClient();

        public GoogleAuthService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<GoogleUserPayload?> VerifyGoogleTokenAsync(string idToken)
        {
            var (payload, _) = await VerifyGoogleTokenWithDetailsAsync(idToken);
            return payload;
        }

        public async Task<(GoogleUserPayload? payload, string? error)> VerifyGoogleTokenWithDetailsAsync(string idToken)
        {
            if (string.IsNullOrWhiteSpace(idToken))
            {
                return (null, "IdToken rỗng");
            }

            string? lastError = null;

            // 1. Thử xác thực qua thư viện Google.Apis.Auth với Audience (nếu có cấu hình)
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings();
                var clientId = _configuration["Google:ClientId"];

                if (!string.IsNullOrEmpty(clientId) && !clientId.Contains("YOUR_GOOGLE_CLIENT"))
                {
                    settings.Audience = new[] { clientId };
                }

                var gPayload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
                if (gPayload != null)
                {
                    return (new GoogleUserPayload
                    {
                        Subject = gPayload.Subject,
                        Email = gPayload.Email,
                        Name = gPayload.Name,
                        Picture = gPayload.Picture,
                        Audience = gPayload.Audience?.ToString()
                    }, null);
                }
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
                Console.WriteLine($"[GoogleAuth Layer1 Error]: {ex.Message}");
            }

            // 2. Thử xác thực qua thư viện Google.Apis.Auth không ràng buộc Audience
            try
            {
                var gPayload = await GoogleJsonWebSignature.ValidateAsync(idToken);
                if (gPayload != null)
                {
                    return (new GoogleUserPayload
                    {
                        Subject = gPayload.Subject,
                        Email = gPayload.Email,
                        Name = gPayload.Name,
                        Picture = gPayload.Picture,
                        Audience = gPayload.Audience?.ToString()
                    }, null);
                }
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
                Console.WriteLine($"[GoogleAuth Layer2 Error]: {ex.Message}");
            }

            // 3. Fallback: Gọi trực tiếp Endpoint chính thức của Google: https://oauth2.googleapis.com/tokeninfo
            try
            {
                var url = $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}";
                var response = await _httpClient.GetAsync(url);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(jsonString);
                    var root = doc.RootElement;

                    var email = root.TryGetProperty("email", out var emailProp) ? emailProp.GetString() : null;
                    var sub = root.TryGetProperty("sub", out var subProp) ? subProp.GetString() : null;
                    var name = root.TryGetProperty("name", out var nameProp) ? nameProp.GetString() : null;
                    var picture = root.TryGetProperty("picture", out var picProp) ? picProp.GetString() : null;
                    var aud = root.TryGetProperty("aud", out var audProp) ? audProp.GetString() : null;

                    if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(sub))
                    {
                        return (new GoogleUserPayload
                        {
                            Subject = sub,
                            Email = email,
                            Name = name,
                            Picture = picture,
                            Audience = aud
                        }, null);
                    }
                }
                else
                {
                    lastError = $"Google tokeninfo endpoint returned {response.StatusCode}: {jsonString}";
                    Console.WriteLine($"[GoogleAuth Layer3 Error]: {lastError}");
                }
            }
            catch (Exception ex)
            {
                lastError = $"Lỗi kết nối tới Google OAuth API: {ex.Message}";
                Console.WriteLine($"[GoogleAuth Layer3 Exception]: {ex.Message}");
            }

            return (null, lastError ?? "Không thể xác minh tính hợp lệ của Google ID Token");
        }
    }
}
