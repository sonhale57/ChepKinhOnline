using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using ChepKinh.Api.Data;
using ChepKinh.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers & JSON Options
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Database Configuration (SQL Server 2008 Compatibility Level 100)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseSqlServer(connStr, sqlOptions =>
    {
        // Bắt buộc tuân thủ AGENTS.md & fullstack-develop: Tương thích SQL Server 2008 / 2008 R2
        sqlOptions.UseCompatibilityLevel(100);
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    });
});

// 3. Register Application Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<ISutraService, SutraService>();
builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<IPdfExtractionService, PdfExtractionService>();

// 4. JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "ChepKinh_Super_Secret_Key_2026_Fullstack_Vietnam_Long_Key_String";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ChepKinhApi",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ChepKinhApp",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// 5. Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("sutras.view", policy => policy.RequireClaim("permission", "sutras.view"));
    options.AddPolicy("sutras.manage", policy => policy.RequireClaim("permission", "sutras.manage"));
    options.AddPolicy("users.view", policy => policy.RequireClaim("permission", "users.view"));
    options.AddPolicy("users.manage", policy => policy.RequireClaim("permission", "users.manage"));
    options.AddPolicy("reports.view", policy => policy.RequireClaim("permission", "reports.view"));
    options.AddPolicy("ink.sync", policy => policy.RequireClaim("permission", "ink.sync"));
});

// 6. CORS Policy cho Frontend Web/PWA
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Auto-seed database at startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await DbSeeder.SeedAsync(db);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DbSeeder Error/Skip]: {ex.Message}");
    }
}

app.Run();
