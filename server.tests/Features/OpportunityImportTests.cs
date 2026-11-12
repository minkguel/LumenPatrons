using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Tests.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LumenPatrons.Api.Tests.Features;

public sealed class OpportunityImportTests : IClassFixture<SecurityWebApplicationFactory>
{
    private const string ImportRoute = "/api/v1/fundingopportunities/import";
    private readonly SecurityWebApplicationFactory _factory;

    public OpportunityImportTests(SecurityWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Non_admin_import_is_forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient(Guid.NewGuid());

        var response = await PostJsonAsync(client, "[]");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_import_is_unauthorized()
    {
        using var client = _factory.CreateClient(new() { AllowAutoRedirect = false });

        var response = await PostJsonAsync(client, "[]");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Import_creates_new_opportunities()
    {
        var url1 = Url("create-1");
        var url2 = Url("create-2");
        using var client = AdminClient();

        var result = await ImportAsync(client, $$"""
            [
              {"title":"One","patron_name":"Patron","category":"Tech","external_url":"{{url1}}"},
              {"title":"Two","patron_name":"Patron","category":["Tech","Art"],"external_url":"{{url2}}"}
            ]
            """);

        Assert.Equal(2, result.Created);
        var rows = await QueryAsync(db => db.FundingOpportunities.Where(f => f.ExternalUrl == url1 || f.ExternalUrl == url2).ToListAsync());
        Assert.Equal(2, rows.Count);
        Assert.All(rows, r => Assert.Equal("Open", r.Status));
    }

    [Fact]
    public async Task Reimporting_same_file_updates_instead_of_duplicating()
    {
        var url1 = Url("reimport-1");
        var url2 = Url("reimport-2");
        var body = $$"""
            [
              {"title":"One","patron_name":"Patron","external_url":"{{url1}}"},
              {"title":"Two","patron_name":"Patron","external_url":"{{url2}}"}
            ]
            """;
        using var client = AdminClient();

        await ImportAsync(client, body);
        var second = await ImportAsync(client, body);

        Assert.Equal(0, second.Created);
        Assert.Equal(2, second.Updated);
        var count = await QueryAsync(db => db.FundingOpportunities.CountAsync(f => f.ExternalUrl == url1 || f.ExternalUrl == url2));
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task Duplicate_link_in_one_file_is_stored_once()
    {
        var host = $"dup{Guid.NewGuid():N}.dk";
        using var client = AdminClient();

        var result = await ImportAsync(client, $$"""
            [
              {"title":"First","patron_name":"P","external_url":"https://{{host}}/x"},
              {"title":"Later","patron_name":"P","external_url":"https://{{host.ToUpperInvariant()}}/x/"}
            ]
            """);

        Assert.Equal(1, result.Created);
        var rows = await QueryAsync(db => db.FundingOpportunities.Where(f => f.ExternalUrl.ToLower().Contains(host)).ToListAsync());
        var row = Assert.Single(rows);
        Assert.Equal("Later", row.Title);
    }

    [Fact]
    public async Task Empty_strings_from_scraper_become_null()
    {
        var url = Url("innofounder");
        using var client = AdminClient();

        var result = await ImportAsync(client, $$"""
            [{"title":"Innofounder","patron_name":"Innovation Fund Denmark","category":"Startup","external_url":"{{url}}","description":"","deadline":"","minimum_amount":""}]
            """);

        Assert.Equal(1, result.Created);
        var row = await QueryAsync(db => db.FundingOpportunities.SingleAsync(f => f.ExternalUrl == url));
        Assert.Null(row.Deadline);
        Assert.Null(row.EstimatedAmount);
        Assert.Equal(new[] { "Startup" }, row.Category);
    }

    [Fact]
    public async Task Amount_and_currency_are_normalised()
    {
        var url1 = Url("money-1");
        var url2 = Url("money-2");
        using var client = AdminClient();

        await ImportAsync(client, $$"""
            [
              {"title":"A","patron_name":"P","external_url":"{{url1}}","estimated_amount":"500000","currency":"dkk"},
              {"title":"B","patron_name":"P","external_url":"{{url2}}","estimated_amount":1500.5,"currency":"kr"}
            ]
            """);

        var a = await QueryAsync(db => db.FundingOpportunities.SingleAsync(f => f.ExternalUrl == url1));
        var b = await QueryAsync(db => db.FundingOpportunities.SingleAsync(f => f.ExternalUrl == url2));
        Assert.Equal(500000m, a.EstimatedAmount);
        Assert.Equal("DKK", a.Currency);
        Assert.Equal(1500.5m, b.EstimatedAmount);
        Assert.Null(b.Currency);
    }

    [Fact]
    public async Task Bad_items_are_skipped_and_reported()
    {
        var url = Url("bad-ok");
        using var client = AdminClient();

        var result = await ImportAsync(client, $$"""
            [
              {"title":"  ","patron_name":"P","external_url":"https://example.com/blank-title"},
              {"title":"Has title","patron_name":"P","external_url":"not-a-url"},
              {"title":"Fine","patron_name":"P","external_url":"{{url}}"}
            ]
            """);

        Assert.Equal(1, result.Created);
        Assert.Equal(2, result.Skipped);
        Assert.Contains(result.Errors, e => e.Index == 0 && e.Reason == "Missing title");
        Assert.Contains(result.Errors, e => e.Index == 1 && e.Reason == "Invalid link");
    }

    [Fact]
    public async Task Null_element_is_skipped_and_reported()
    {
        var url = Url("null-element");
        using var client = AdminClient();

        var result = await ImportAsync(client, $$"""
            [null, {"title":"Fine","patron_name":"P","external_url":"{{url}}"}]
            """);

        Assert.Equal(1, result.Created);
        Assert.Equal(1, result.Skipped);
        Assert.Contains(result.Errors, e => e.Index == 0 && e.Reason == "Missing title");
    }

    [Fact]
    public async Task Wrongly_shaped_single_fields_are_treated_as_blank()
    {
        var url = Url("shape");
        using var client = AdminClient();

        var result = await ImportAsync(client, $$"""
            [{"title":"Shape","patron_name":"P","category":5,"external_url":"{{url}}","deadline":12,"estimated_amount":true,"currency":7,"description":9}]
            """);

        Assert.Equal(1, result.Created);
        var row = await QueryAsync(db => db.FundingOpportunities.SingleAsync(f => f.ExternalUrl == url));
        Assert.Empty(row.Category);
        Assert.Null(row.Deadline);
        Assert.Null(row.EstimatedAmount);
        Assert.Null(row.Currency);
    }

    [Fact]
    public async Task More_than_500_items_is_rejected()
    {
        using var client = AdminClient();
        var items = Enumerable.Range(0, 501).Select(i => new { title = "T", patron_name = "P", external_url = $"https://many.example/{i}" });

        var response = await PostJsonAsync(client, JsonSerializer.Serialize(items));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Empty_array_is_rejected()
    {
        using var client = AdminClient();

        var response = await PostJsonAsync(client, "[]");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_ignores_client_supplied_id()
    {
        var clientId = Guid.NewGuid();
        using var client = AdminClient();

        var response = await client.PostAsJsonAsync("/api/v1/fundingopportunities", new
        {
            id = clientId,
            title = "Id test",
            patronName = "P",
            category = new[] { "X" },
            externalUrl = Url("client-id")
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JsonElement>(TestContext.Current.CancellationToken);
        Assert.NotEqual(clientId, created.GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Create_without_title_is_400()
    {
        using var client = AdminClient();

        var response = await client.PostAsJsonAsync("/api/v1/fundingopportunities", new
        {
            patronName = "P",
            externalUrl = Url("no-title")
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static string Url(string name) => $"https://{name}-{Guid.NewGuid():N}.example.com/grant";

    private HttpClient AdminClient() => _factory.CreateAuthenticatedClient(Guid.NewGuid(), admin: true);

    private static Task<HttpResponseMessage> PostJsonAsync(HttpClient client, string json) =>
        client.PostAsync(ImportRoute, new StringContent(json, Encoding.UTF8, "application/json"),
            TestContext.Current.CancellationToken);

    private static async Task<ImportResultDto> ImportAsync(HttpClient client, string json)
    {
        var response = await PostJsonAsync(client, json);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<ImportResultDto>(TestContext.Current.CancellationToken))!;
    }

    private async Task<T> QueryAsync<T>(Func<AppDbContext, Task<T>> query)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        return await query(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private sealed record ImportResultDto(int Created, int Updated, int Skipped, List<ImportErrorDto> Errors);

    private sealed record ImportErrorDto(int Index, string Reason);
}
