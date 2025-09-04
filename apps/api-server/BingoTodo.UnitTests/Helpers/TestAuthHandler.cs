namespace BingoTodo.UnitTests.Helpers;

using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Identity.Web;

public class TestAuthHandlerOptions : AuthenticationSchemeOptions { }

public class TestAuthHandler(
    IOptionsMonitor<TestAuthHandlerOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder
) : AuthenticationHandler<TestAuthHandlerOptions>(options, logger, encoder)
{
    public const string AuthenticationScheme = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        Request.Headers.TryGetValue("UserId", out var userId);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "123"),
            new("preferred_username", "bingo@todo.www"),
            new("oid", userId.FirstOrDefault() ?? Guid.Empty.ToString()),
            new(ClaimConstants.Name, "Test user"),
        };

        var identity = new ClaimsIdentity(claims, AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, AuthenticationScheme);

        var result = AuthenticateResult.Success(ticket);

        return Task.FromResult(result);
    }
}
