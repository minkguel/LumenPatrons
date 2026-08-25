using LumenPatrons.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;


var builder = WebApplication.CreateBuilder(args);

var supabaseUrl = builder.Configuration["Supabase:Url"]?.TrimEnd('/')
    ?? throw new InvalidOperationException("Supabase:Url must be configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SupabaseConnection")));

builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowNextJs",
            policy =>
            {
                policy.WithOrigins("http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
    });

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.MetadataAddress = $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";
        options.RequireHttpsMetadata = true;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "sub"
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireAuthenticatedUser().RequireAssertion(context =>
        {
            var appMetadata = context.User.FindFirst("app_metadata")?.Value;
            if (string.IsNullOrWhiteSpace(appMetadata)) return false;

            try
            {
                using var json = JsonDocument.Parse(appMetadata);
                return json.RootElement.TryGetProperty("role", out var role)
                    && role.GetString() == "admin";
            }
            catch (JsonException)
            {
                return false;
            }
        }));
});

builder.Services.AddControllers();


var app = builder.Build();

app.UseCors("AllowNextJs");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/v1/status", async (AppDbContext db) =>
{
    // Attempt to ping Supabase
    bool canConnect = await db.Database.CanConnectAsync();

    return new
    {
        service = "LumenPatrons API",
        database = canConnect ? "Connected to Supabase!" : "Database Offline",
        timestamp = DateTime.UtcNow
    };
}).AllowAnonymous();

app.UseHttpsRedirection();

app.Run();

public partial class Program;
