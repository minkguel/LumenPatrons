using System.Net;
using System.Net.Http.Json;
using LumenPatrons.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LumenPatrons.Api.Tests.Security;

public sealed class UserProfileProvisioningTests : IClassFixture<SecurityWebApplicationFactory>
{
    private const string MeUrl = "/api/v1/userprofiles/me";
    private readonly SecurityWebApplicationFactory _factory;

    public UserProfileProvisioningTests(SecurityWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Get_me_returns_404_before_provisioning()
    {
        using var client = _factory.CreateAuthenticatedClient(Guid.NewGuid());

        var response = await client.GetAsync(MeUrl, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_me_creates_then_updates_a_single_row()
    {
        var userId = Guid.NewGuid();
        using var client = _factory.CreateAuthenticatedClient(userId);
        var ct = TestContext.Current.CancellationToken;

        var first = await client.PutAsJsonAsync(MeUrl, new { fullName = "Jane", userType = "Founder" }, ct);
        var second = await client.PutAsJsonAsync(MeUrl, new { fullName = "Jane B", userType = "Researcher" }, ct);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Equal(1, await db.UserProfiles.CountAsync(p => p.Id == userId, ct));
        var stored = await db.UserProfiles.SingleAsync(p => p.Id == userId, ct);
        Assert.Equal("Jane B", stored.FullName);
    }

    [Fact]
    public async Task Put_me_takes_email_from_token_not_body()
    {
        var userId = Guid.NewGuid();
        using var client = _factory.CreateAuthenticatedClient(userId);
        var ct = TestContext.Current.CancellationToken;

        var response = await client.PutAsJsonAsync(
            MeUrl, new { fullName = "Jane", userType = "Founder", email = "spoof@evil.com" }, ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.UserProfiles.SingleAsync(p => p.Id == userId, ct);
        Assert.Equal($"{userId}@example.com", stored.Email);
    }

    [Fact]
    public async Task Put_me_rejects_full_name_over_100_chars()
    {
        using var client = _factory.CreateAuthenticatedClient(Guid.NewGuid());

        var response = await client.PutAsJsonAsync(
            MeUrl, new { fullName = new string('a', 101), userType = "Founder" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
