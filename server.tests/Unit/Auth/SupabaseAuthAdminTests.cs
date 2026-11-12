using System.Net;
using LumenPatrons.Api.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LumenPatrons.Api.Tests.Unit.Auth;

public sealed class SupabaseAuthAdminTests
{
    private const string TestKey = "test-service-key";
    private static readonly Guid UserId = Guid.NewGuid();

    [Theory]
    [InlineData(HttpStatusCode.OK, true)]
    [InlineData(HttpStatusCode.NoContent, true)]
    [InlineData(HttpStatusCode.NotFound, true)]
    [InlineData(HttpStatusCode.InternalServerError, false)]
    [InlineData(HttpStatusCode.Forbidden, false)]
    public async Task Maps_response_status_to_result(HttpStatusCode status, bool expected)
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(status));

        var result = await Create(handler, TestKey).DeleteAsync(UserId, CancellationToken.None);

        Assert.Equal(expected, result);
    }

    [Fact]
    public async Task Sends_delete_with_both_headers_to_admin_url()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));

        await Create(handler, TestKey).DeleteAsync(UserId, CancellationToken.None);

        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Delete, request.Method);
        Assert.Equal($"https://test.supabase.co/auth/v1/admin/users/{UserId}", request.RequestUri!.ToString());
        Assert.Equal(TestKey, Assert.Single(request.Headers.GetValues("apikey")));
        Assert.Equal("Bearer", request.Headers.Authorization!.Scheme);
        Assert.Equal(TestKey, request.Headers.Authorization!.Parameter);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Missing_key_returns_false_without_sending_a_request(string? key)
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK));

        var result = await Create(handler, key).DeleteAsync(UserId, CancellationToken.None);

        Assert.False(result);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task Network_failure_returns_false()
    {
        var handler = new StubHandler(_ => throw new HttpRequestException("boom"));

        var result = await Create(handler, TestKey).DeleteAsync(UserId, CancellationToken.None);

        Assert.False(result);
    }

    [Fact]
    public async Task Timeout_returns_false()
    {
        var handler = new StubHandler(_ => throw new TaskCanceledException("timeout"));

        var result = await Create(handler, TestKey).DeleteAsync(UserId, CancellationToken.None);

        Assert.False(result);
    }

    private static SupabaseAuthAdmin Create(StubHandler handler, string? key)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Supabase:Url"] = "https://test.supabase.co/",
            ["Supabase:ServiceRoleKey"] = key
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        return new SupabaseAuthAdmin(new HttpClient(handler), config, NullLogger<SupabaseAuthAdmin>.Instance);
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = new();

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(respond(request));
        }
    }
}
