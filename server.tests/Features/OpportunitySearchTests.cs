using System.Net;
using System.Net.Http.Json;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Tests.Security;
using Xunit;

namespace LumenPatrons.Api.Tests.Features;

public sealed class OpportunitySearchTests : IClassFixture<SecurityWebApplicationFactory>, IAsyncLifetime
{
    private const string Route = "/api/v1/fundingopportunities";
    private static readonly SemaphoreSlim SeedLock = new(1, 1);
    private readonly SecurityWebApplicationFactory _factory;
    private static bool _seeded;

    public OpportunitySearchTests(SecurityWebApplicationFactory factory) => _factory = factory;

    public async ValueTask InitializeAsync()
    {
        // The factory is shared by the tests of this class, so seed only once.
        await SeedLock.WaitAsync();
        try
        {
            if (_seeded) return;
            await _factory.SeedAsync(db =>
            {
                var now = DateTime.UtcNow;
                db.FundingOpportunities.AddRange(
                    new FundingOpportunity
                    {
                        Id = Guid.NewGuid(), Title = "Innobooster", PatronName = "Innovation Fund Denmark",
                        Category = ["Startup"], Description = "Supports quantum founders",
                        Deadline = now.AddDays(30), CreatedAt = now.AddMinutes(-1)
                    },
                    new FundingOpportunity
                    {
                        Id = Guid.NewGuid(), Title = "Health grant 100%", PatronName = "Novo Nordisk Foundation",
                        Category = ["Health"], CreatedAt = now.AddMinutes(-2)
                    },
                    new FundingOpportunity
                    {
                        Id = Guid.NewGuid(), Title = "Old call", PatronName = "Past Patron",
                        Category = ["Startup"], Deadline = now.AddDays(-1), CreatedAt = now.AddMinutes(-3)
                    },
                    new FundingOpportunity
                    {
                        Id = Guid.NewGuid(), Title = "Shut", PatronName = "Closed Patron",
                        Category = ["Other"], Status = "Closed", CreatedAt = now.AddMinutes(-4)
                    });
                return Task.CompletedTask;
            });
            _seeded = true;
        }
        finally { SeedLock.Release(); }
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    private sealed record Item(Guid Id, string Title);

    private async Task<string[]> TitlesAsync(string query)
    {
        using var client = _factory.CreateClient();
        var items = await client.GetFromJsonAsync<List<Item>>($"{Route}{query}", TestContext.Current.CancellationToken);
        return items!.Select(i => i.Title).Order().ToArray();
    }

    [Fact]
    public async Task Closed_rows_are_hidden_by_default() =>
        Assert.Equal(["Health grant 100%", "Innobooster"], await TitlesAsync(""));

    [Fact]
    public async Task Include_closed_returns_everything() =>
        Assert.Equal(["Health grant 100%", "Innobooster", "Old call", "Shut"], await TitlesAsync("?includeClosed=true"));

    [Fact]
    public async Task Closed_row_is_still_returned_by_id()
    {
        using var client = _factory.CreateClient();
        var all = await client.GetFromJsonAsync<List<Item>>($"{Route}?includeClosed=true", TestContext.Current.CancellationToken);
        var shut = all!.Single(i => i.Title == "Shut");

        var response = await client.GetAsync($"{Route}/{shut.Id}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Search_matches_title_case_insensitively() =>
        Assert.Equal(["Innobooster"], await TitlesAsync("?q=innob"));

    [Fact]
    public async Task Search_matches_patron_name() =>
        Assert.Equal(["Health grant 100%"], await TitlesAsync("?q=novo"));

    [Fact]
    public async Task Search_matches_description() =>
        Assert.Equal(["Innobooster"], await TitlesAsync("?q=QUANTUM"));

    [Fact]
    public async Task Blank_search_applies_no_filter() =>
        Assert.Equal(["Health grant 100%", "Innobooster"], await TitlesAsync("?q=%20%20"));

    [Fact]
    public async Task Percent_in_search_is_literal() =>
        Assert.Equal(["Health grant 100%"], await TitlesAsync("?q=100%25"));

    [Fact]
    public async Task Underscore_in_search_is_literal() =>
        Assert.Empty(await TitlesAsync("?q=_"));

    [Fact]
    public async Task Search_longer_than_100_characters_is_rejected()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync($"{Route}?q={new string('a', 101)}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Category_filter_matches_exactly() =>
        Assert.Equal(["Innobooster"], await TitlesAsync("?category=Startup"));

    [Fact]
    public async Task Category_filter_is_case_insensitive() =>
        Assert.Equal(["Innobooster"], await TitlesAsync("?category=startup"));

    [Fact]
    public async Task Categories_endpoint_lists_distinct_sorted_categories_of_all_rows()
    {
        using var client = _factory.CreateClient();

        var categories = await client.GetFromJsonAsync<string[]>($"{Route}/categories", TestContext.Current.CancellationToken);

        Assert.Equal(["Health", "Other", "Startup"], categories!);
    }
}
