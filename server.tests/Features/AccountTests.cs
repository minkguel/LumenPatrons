using System.Net;
using System.Net.Http.Json;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Tests.Security;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LumenPatrons.Api.Tests.Features;

public sealed class AccountTests : IClassFixture<SecurityWebApplicationFactory>
{
    private readonly SecurityWebApplicationFactory _factory;

    public AccountTests(SecurityWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.AuthDeleter.Succeeds = true;
    }

    [Fact]
    public async Task Export_returns_own_profile_and_saved_items_only()
    {
        var mine = await SeedUserWithSavedAsync("Mine");
        var other = await SeedUserWithSavedAsync("Other");
        using var client = _factory.CreateAuthenticatedClient(mine);

        var export = await client.GetFromJsonAsync<Export>(
            "/api/v1/userprofiles/me/export", TestContext.Current.CancellationToken);

        Assert.Equal(mine, export!.Profile.Id);
        var item = Assert.Single(export.SavedOpportunities);
        Assert.Equal("Mine", item.Opportunity.Title);
        Assert.DoesNotContain(export.SavedOpportunities, s => s.Opportunity.Title == "Other");
        Assert.NotEqual(other, export.Profile.Id);
        Assert.True(export.ExportedAt > DateTime.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task Export_without_profile_returns_404()
    {
        using var client = _factory.CreateAuthenticatedClient(Guid.NewGuid());

        var response = await client.GetAsync(
            "/api/v1/userprofiles/me/export", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Export_anonymous_returns_401()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync(
            "/api/v1/userprofiles/me/export", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Delete_removes_profile_and_saved_rows_and_auth_identity()
    {
        var userId = await SeedUserWithSavedAsync("Gone");
        using var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.DeleteAsync(
            "/api/v1/userprofiles/me", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Contains(userId, _factory.AuthDeleter.Deleted);
        Assert.False(await ProfileExistsAsync(userId));
        Assert.Equal(0, await SavedCountAsync(userId));
    }

    [Fact]
    public async Task Delete_when_auth_identity_deletion_fails_returns_502_and_removes_nothing()
    {
        var userId = await SeedUserWithSavedAsync("Kept");
        _factory.AuthDeleter.Succeeds = false;
        using var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.DeleteAsync(
            "/api/v1/userprofiles/me", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        Assert.True(await ProfileExistsAsync(userId));
        Assert.Equal(1, await SavedCountAsync(userId));
    }

    [Fact]
    public async Task Delete_leaves_other_users_data_untouched()
    {
        var mine = await SeedUserWithSavedAsync("Mine");
        var other = await SeedUserWithSavedAsync("Other");
        using var client = _factory.CreateAuthenticatedClient(mine);

        await client.DeleteAsync("/api/v1/userprofiles/me", TestContext.Current.CancellationToken);

        Assert.True(await ProfileExistsAsync(other));
        Assert.Equal(1, await SavedCountAsync(other));
        Assert.DoesNotContain(other, _factory.AuthDeleter.Deleted);
    }

    private async Task<Guid> SeedUserWithSavedAsync(string title)
    {
        var userId = Guid.NewGuid();
        await _factory.SeedAsync(db =>
        {
            var user = new UserProfile
            {
                Id = userId, Email = $"{userId}@example.com", FullName = "Test User", UserType = "Founder"
            };
            var opportunity = new FundingOpportunity
            {
                Id = Guid.NewGuid(), Title = title, PatronName = "Patron", ExternalUrl = "https://example.com"
            };
            db.AddRange(user, opportunity);
            db.SavedOpportunities.Add(new SavedOpportunity
            {
                Id = Guid.NewGuid(), UserId = userId, User = user,
                FundingOpportunityId = opportunity.Id, Opportunity = opportunity
            });
            return Task.CompletedTask;
        });
        return userId;
    }

    private async Task<bool> ProfileExistsAsync(Guid userId)
    {
        var exists = false;
        await _factory.SeedAsync(async db => exists = await db.UserProfiles.AnyAsync(u => u.Id == userId));
        return exists;
    }

    private async Task<int> SavedCountAsync(Guid userId)
    {
        var count = 0;
        await _factory.SeedAsync(async db => count = await db.SavedOpportunities.CountAsync(s => s.UserId == userId));
        return count;
    }

    private sealed record ProfileDto(Guid Id, string Email);
    private sealed record OpportunityDto(string Title);
    private sealed record SavedDto(Guid Id, OpportunityDto Opportunity);
    private sealed record Export(ProfileDto Profile, List<SavedDto> SavedOpportunities, DateTime ExportedAt);
}
