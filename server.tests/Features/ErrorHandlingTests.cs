using System.Net;
using LumenPatrons.Api.Tests.Security;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace LumenPatrons.Api.Tests.Features;

[ApiController]
[Route("test-only/boom")]
public sealed class BoomController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => throw new InvalidOperationException("secret database detail");
}

public sealed class ErrorHandlingTests : IClassFixture<SecurityWebApplicationFactory>
{
    private readonly SecurityWebApplicationFactory _factory;

    public ErrorHandlingTests(SecurityWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task Token_without_a_guid_subject_gets_401_problem_details()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("X-Test-User", "not-a-guid");

        var response = await client.GetAsync("/api/v1/userprofiles/me", TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain("   at ", body);
    }

    [Fact]
    public async Task Unexpected_exception_gets_500_problem_details_without_message_or_stack_trace()
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.AddControllers().AddApplicationPart(typeof(BoomController).Assembly)));
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync("/test-only/boom", TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.DoesNotContain("secret database detail", body);
        Assert.DoesNotContain("   at ", body);
    }

    [Fact]
    public async Task Preflight_from_the_configured_origin_is_allowed()
    {
        using var client = _factory.CreateClient();

        var response = await Preflight(client, "http://localhost:3000");

        Assert.Equal("http://localhost:3000", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task Preflight_from_another_origin_is_not_allowed()
    {
        using var client = _factory.CreateClient();

        var response = await Preflight(client, "https://evil.example");

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Preflight_honours_origins_from_configuration()
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
            builder.UseSetting("Cors:AllowedOrigins:0", "https://app.example"));
        using var client = factory.CreateClient();

        var allowed = await Preflight(client, "https://app.example");
        var denied = await Preflight(client, "http://localhost:3000");

        Assert.Equal("https://app.example", allowed.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.False(denied.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private static Task<HttpResponseMessage> Preflight(HttpClient client, string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/userprofiles/me");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        return client.SendAsync(request, TestContext.Current.CancellationToken);
    }
}
