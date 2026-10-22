namespace LumenPatrons.Api.Auth;

public static class SupabaseUrl
{
    private static readonly string[] LoopbackHosts = ["localhost", "127.0.0.1", "[::1]"];

    /// <summary>
    /// True only for a plain-http URL on a loopback host (the local Supabase CLI stack).
    /// Used to relax <c>RequireHttpsMetadata</c> for local tests; every other URL keeps HTTPS required.
    /// </summary>
    public static bool IsLoopbackHttp(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttp
        && LoopbackHosts.Contains(uri.Host, StringComparer.OrdinalIgnoreCase);
}
