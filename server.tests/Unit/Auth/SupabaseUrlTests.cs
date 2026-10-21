using LumenPatrons.Api.Auth;
using Xunit;

namespace LumenPatrons.Api.Tests.Unit.Auth;

public sealed class SupabaseUrlTests
{
    [Theory]
    [InlineData("http://127.0.0.1:54321")]
    [InlineData("http://localhost:54321")]
    [InlineData("http://[::1]:54321")]
    public void IsLoopbackHttp_returns_true_for_loopback_http(string url)
    {
        Assert.True(SupabaseUrl.IsLoopbackHttp(url));
    }

    [Theory]
    [InlineData("https://x.supabase.co")]
    [InlineData("http://evil.com")]
    [InlineData("http://127.0.0.1.evil.com")]
    [InlineData("https://127.0.0.1:54321")]
    [InlineData("http://localhost.evil.com")]
    [InlineData("ftp://localhost")]
    [InlineData("not a url")]
    [InlineData("")]
    public void IsLoopbackHttp_returns_false_otherwise(string url)
    {
        Assert.False(SupabaseUrl.IsLoopbackHttp(url));
    }
}
