using LumenPatrons.Api.Data;
using LumenPatrons.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace LumenPatrons.Api.Tests.Security;

public sealed class SecurityWebApplicationFactory : WebApplicationFactory<Program>
{
    public FakeAuthIdentityDeleter AuthDeleter { get; } = new();

    private readonly string _databaseName = $"security-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Supabase:Url", "https://test.supabase.co");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_databaseName));

            services.RemoveAll<IAuthIdentityDeleter>();
            services.AddSingleton<IAuthIdentityDeleter>(AuthDeleter);

            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthHandler.AuthenticationScheme;
                    options.DefaultChallengeScheme = TestAuthHandler.AuthenticationScheme;
                    options.DefaultForbidScheme = TestAuthHandler.AuthenticationScheme;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.AuthenticationScheme, _ => { });
        });
    }

    public async Task SeedAsync(Func<AppDbContext, Task> seed)
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await seed(db);
        await db.SaveChangesAsync();
    }

    public HttpClient CreateAuthenticatedClient(Guid userId, bool admin = false, string? email = null)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("X-Test-User", userId.ToString());
        client.DefaultRequestHeaders.Add("X-Test-Email", email ?? $"{userId}@example.com");
        if (admin) client.DefaultRequestHeaders.Add("X-Test-Admin", "true");
        return client;
    }
}

public sealed class FakeAuthIdentityDeleter : IAuthIdentityDeleter
{
    public bool Succeeds { get; set; } = true;
    public List<Guid> Deleted { get; } = new();

    public Task<bool> DeleteAsync(Guid userId, CancellationToken ct)
    {
        if (!Succeeds) return Task.FromResult(false);
        Deleted.Add(userId);
        return Task.FromResult(true);
    }
}
