using System.Net;
using System.Net.Http.Json;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Tests.Security;
using Xunit;

namespace LumenPatrons.Api.Tests.Features;

public sealed class SavedStatusTests : IClassFixture<SecurityWebApplicationFactory>
{
    private readonly SecurityWebApplicationFactory _factory;

    public SavedStatusTests(SecurityWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Put_Submitted_returns_204_and_is_stored()
    {
        var (userId, savedId) = await SeedSavedAsync();
        using var client = _factory.CreateAuthenticatedClient(userId);

        var response = await Put(client, savedId, "Submitted");
        var item = await client.GetFromJsonAsync<SavedItem>(
            $"/api/v1/savedopportunities/{savedId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("Submitted", item!.Status);
    }

    [Fact]
    public async Task Put_lowercase_status_is_stored_with_canonical_casing()
    {
        var (userId, savedId) = await SeedSavedAsync();
        using var client = _factory.CreateAuthenticatedClient(userId);

        var response = await Put(client, savedId, "submitted");
        var item = await client.GetFromJsonAsync<SavedItem>(
            $"/api/v1/savedopportunities/{savedId}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("Submitted", item!.Status);
    }

    [Fact]
    public async Task Put_Applied_is_rejected()
    {
        var (userId, savedId) = await SeedSavedAsync();
        using var client = _factory.CreateAuthenticatedClient(userId);

        var response = await Put(client, savedId, "Applied");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Put_on_another_users_row_returns_404()
    {
        var (_, savedId) = await SeedSavedAsync();
        using var other = _factory.CreateAuthenticatedClient(Guid.NewGuid());

        var response = await Put(other, savedId, "Submitted");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_status_keeps_the_attached_document_url()
    {
        var (userId, savedId) = await SeedSavedAsync("https://example.com/doc.pdf");
        using var client = _factory.CreateAuthenticatedClient(userId);

        await Put(client, savedId, "Submitted");
        var item = await client.GetFromJsonAsync<SavedItem>(
            $"/api/v1/savedopportunities/{savedId}", TestContext.Current.CancellationToken);

        Assert.Equal("https://example.com/doc.pdf", item!.AttachedDocumentUrl);
    }

    [Fact]
    public async Task Post_with_Applied_status_is_rejected()
    {
        var userId = Guid.NewGuid();
        var opportunityId = Guid.NewGuid();
        await _factory.SeedAsync(db =>
        {
            db.AddRange(Profile(userId), Opportunity(opportunityId));
            return Task.CompletedTask;
        });
        using var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/v1/savedopportunities",
            new { fundingOpportunityId = opportunityId, status = "Applied" },
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static Task<HttpResponseMessage> Put(HttpClient client, Guid id, string status) =>
        client.PutAsJsonAsync($"/api/v1/savedopportunities/{id}", new { status },
            TestContext.Current.CancellationToken);

    private async Task<(Guid UserId, Guid SavedId)> SeedSavedAsync(string? documentUrl = null)
    {
        var userId = Guid.NewGuid();
        var opportunityId = Guid.NewGuid();
        var savedId = Guid.NewGuid();
        await _factory.SeedAsync(db =>
        {
            var user = Profile(userId);
            var opportunity = Opportunity(opportunityId);
            db.AddRange(user, opportunity);
            db.SavedOpportunities.Add(new SavedOpportunity
            {
                Id = savedId,
                UserId = userId,
                User = user,
                FundingOpportunityId = opportunityId,
                Opportunity = opportunity,
                Status = "Saved",
                AttachedDocumentUrl = documentUrl
            });
            return Task.CompletedTask;
        });
        return (userId, savedId);
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

    private sealed record SavedItem(Guid Id, string Status, string? AttachedDocumentUrl);
}
