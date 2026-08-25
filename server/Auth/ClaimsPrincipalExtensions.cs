using System.Security.Claims;

namespace LumenPatrons.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
    {
        var subject = principal.FindFirstValue("sub");
        if (!Guid.TryParse(subject, out var userId))
            throw new UnauthorizedAccessException("The access token has no valid subject.");

        return userId;
    }

    public static string GetRequiredEmail(this ClaimsPrincipal principal)
    {
        var email = principal.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
            throw new UnauthorizedAccessException("The access token has no email claim.");

        return email;
    }
}
