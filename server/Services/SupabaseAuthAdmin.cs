using System.Net;

namespace LumenPatrons.Api.Services;

public interface IAuthIdentityDeleter
{
    Task<bool> DeleteAsync(Guid userId, CancellationToken ct);
}

// Deletes a login through the Supabase Auth admin API. Needs Supabase:ServiceRoleKey,
// a server-only secret. Without it, deletion reports failure instead of throwing.
public sealed class SupabaseAuthAdmin : IAuthIdentityDeleter
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<SupabaseAuthAdmin> _logger;

    public SupabaseAuthAdmin(HttpClient http, IConfiguration config, ILogger<SupabaseAuthAdmin> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<bool> DeleteAsync(Guid userId, CancellationToken ct)
    {
        var key = _config["Supabase:ServiceRoleKey"];
        if (string.IsNullOrWhiteSpace(key))
        {
            _logger.LogWarning("Supabase:ServiceRoleKey is not configured; cannot delete the auth identity.");
            return false;
        }

        var baseUrl = _config["Supabase:Url"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            _logger.LogWarning("Supabase:Url is not configured; cannot delete the auth identity.");
            return false;
        }

        using var request = new HttpRequestMessage(HttpMethod.Delete, $"{baseUrl}/auth/v1/admin/users/{userId}");
        request.Headers.Add("apikey", key);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", key);

        try
        {
            using var response = await _http.SendAsync(request, ct);
            if (response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.NotFound) return true;
            _logger.LogWarning("Supabase admin delete returned {StatusCode}.", (int)response.StatusCode);
            return false;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            if (ct.IsCancellationRequested) throw;
            _logger.LogWarning(ex, "Supabase admin delete failed.");
            return false;
        }
    }
}
