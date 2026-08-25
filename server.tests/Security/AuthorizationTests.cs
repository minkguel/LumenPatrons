using System.Net;
using System.Net.Http.Json;
using LumenPatrons.Api.Models;
using Xunit;

namespace LumenPatrons.Api.Tests.Security;

public sealed class AuthorizationTests : IClassFixture<SecurityWebApplicationFactory>
{
    private readonly SecurityWebApplicationFactory _factory;

    public AuthorizationTests(SecurityWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Anonymous_user_cannot_read_a_profile()
    {
        using var client = _factory.CreateClient(new() { AllowAutoRedirect = false });

        var response = await client.GetAsync("/api/v1/userprofiles/me", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task User_cannot_read_another_users_saved_opportunity_by_id()
    {
        var ownerId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var opportunityId = Guid.NewGuid();
        var savedId = Guid.NewGuid();
        await _factory.SeedAsync(db =>
        {
            var owner = Profile(ownerId);
            var opportunity = Opportunity(opportunityId);
            db.AddRange(owner, Profile(otherUserId), opportunity);
            db.SavedOpportunities.Add(new SavedOpportunity
            {
                Id = savedId,
                UserId = ownerId,
                User = owner,
                FundingOpportunityId = opportunityId,
                Opportunity = opportunity
            });
            return Task.CompletedTask;
        });
        using var client = _factory.CreateAuthenticatedClient(otherUserId);

        var response = await client.GetAsync($"/api/v1/savedopportunities/{savedId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task User_cannot_delete_another_users_saved_opportunity()
    {
        var ownerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();
        var opportunityId = Guid.NewGuid();
        var savedId = Guid.NewGuid();
        await _factory.SeedAsync(db =>
        {
            var owner = Profile(ownerId);
            var opportunity = Opportunity(opportunityId);
            db.AddRange(owner, Profile(attackerId), opportunity);
            db.SavedOpportunities.Add(new SavedOpportunity
            {
                Id = savedId,
                UserId = ownerId,
                User = owner,
                FundingOpportunityId = opportunityId,
                Opportunity = opportunity
            });
            return Task.CompletedTask;
        });
        using var attacker = _factory.CreateAuthenticatedClient(attackerId);
        using var ownerClient = _factory.CreateAuthenticatedClient(ownerId);

        var deleteResponse = await attacker.DeleteAsync($"/api/v1/savedopportunities/{savedId}", TestContext.Current.CancellationToken);
        var ownerReadResponse = await ownerClient.GetAsync($"/api/v1/savedopportunities/{savedId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ownerReadResponse.StatusCode);
    }

    [Fact]
    public async Task Request_body_cannot_spoof_saved_opportunity_owner()
    {
        var authenticatedUserId = Guid.NewGuid();
        var spoofedUserId = Guid.NewGuid();
        var opportunityId = Guid.NewGuid();
        await _factory.SeedAsync(db =>
        {
            db.AddRange(Profile(authenticatedUserId), Profile(spoofedUserId), Opportunity(opportunityId));
            return Task.CompletedTask;
        });
        using var authenticatedClient = _factory.CreateAuthenticatedClient(authenticatedUserId);
        using var spoofedClient = _factory.CreateAuthenticatedClient(spoofedUserId);

        var createResponse = await authenticatedClient.PostAsJsonAsync("/api/v1/savedopportunities", new
        {
            fundingOpportunityId = opportunityId,
            status = "Saved",
            userId = spoofedUserId
        }, TestContext.Current.CancellationToken);
        var authenticatedItems = await authenticatedClient.GetFromJsonAsync<List<SavedItem>>(
            "/api/v1/savedopportunities", TestContext.Current.CancellationToken);
        var spoofedItems = await spoofedClient.GetFromJsonAsync<List<SavedItem>>(
            "/api/v1/savedopportunities", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Single(authenticatedItems!);
        Assert.Empty(spoofedItems!);
    }

    [Fact]
    public async Task Non_admin_cannot_create_a_funding_opportunity()
    {
        using var client = _factory.CreateAuthenticatedClient(Guid.NewGuid());

        var response = await client.PostAsJsonAsync("/api/v1/fundingopportunities", new
        {
            title = "Protected grant",
            patronName = "Test Patron",
            category = new[] { "Test" },
            externalUrl = "https://example.com/grant"
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_from_app_metadata_can_create_a_funding_opportunity()
    {
        using var client = _factory.CreateAuthenticatedClient(Guid.NewGuid(), admin: true);

        var response = await client.PostAsJsonAsync("/api/v1/fundingopportunities", new
        {
            title = "Admin grant",
            patronName = "Test Patron",
            category = new[] { "Test" },
            externalUrl = "https://example.com/admin-grant"
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static UserProfile Profile(Guid id) => new()
    {
        Id = id,
        Email = $"{id}@example.com",
        FullName = "Test User",
        UserType = "Founder"
    };

    private static FundingOpportunity Opportunity(Guid id) => new()
    {
        Id = id,
        Title = $"Opportunity {id}",
        PatronName = "Test Patron",
        ExternalUrl = "https://example.com"
    };

    private sealed record SavedItem(Guid Id, string Status);
}
