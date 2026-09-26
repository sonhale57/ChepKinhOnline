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
                if (!string.IsNullOrEmpty(clientId))
                {
                    settings.Audience = new[] { clientId };
                }

                return await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            }
            catch (Exception)
            {
                return null;
            }
        }
    }
}
