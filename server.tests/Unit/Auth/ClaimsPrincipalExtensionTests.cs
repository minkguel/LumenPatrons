using System.Security.Claims;
using LumenPatrons.Api.Auth;
using Xunit;

namespace LumenPatrons.Api.Tests.Unit.Auth;

public sealed class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetRequiredUserId_returns_subject_as_guid()
    {
        var expectedUserId = Guid.NewGuid();
        var principal = CreatePrincipal(
            new Claim("sub", expectedUserId.ToString()));

        var result = principal.GetRequiredUserId();

        Assert.Equal(expectedUserId, result);
    }

    [Fact]
    public void GetRequiredUserId_throws_when_subject_is_missing()
    {
        var principal = CreatePrincipal();

        var exception = Assert.Throws<UnauthorizedAccessException>(
            () => principal.GetRequiredUserId());

        Assert.Equal(
            "The access token has no valid subject.",
            exception.Message);
    }

    [Fact]
    public void GetRequiredUserId_throws_when_subject_is_not_a_guid()
    {
        var principal = CreatePrincipal(
            new Claim("sub", "not-a-guid"));

        Assert.Throws<UnauthorizedAccessException>(
            () => principal.GetRequiredUserId());
    }

    [Fact]
    public void GetRequiredEmail_returns_email_claim()
    {
        var principal = CreatePrincipal(
            new Claim("email", "user@example.com"));

        var result = principal.GetRequiredEmail();

        Assert.Equal("user@example.com", result);
    }

    [Fact]
    public void GetRequiredEmail_throws_when_email_is_missing()
    {
        var principal = CreatePrincipal();

        Assert.Throws<UnauthorizedAccessException>(
            () => principal.GetRequiredEmail());
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("   ")]
    public void GetRequiredEmail_throws_when_email_is_blank(string email)
    {
        var principal = CreatePrincipal(
            new Claim("email", email));

        Assert.Throws<UnauthorizedAccessException>(
            () => principal.GetRequiredEmail());
    }

    private static ClaimsPrincipal CreatePrincipal(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, "TestAuthentication");
        return new ClaimsPrincipal(identity);
    }
}
