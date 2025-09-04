namespace BingoTodo.Common.Extensions;

using System.Net.Mail;
using System.Security.Claims;
using BingoTodo.Common.Models;
using Microsoft.Identity.Web;

public static class ClaimsPrincipalExtensions
{
    public static User? ExtractUser(this ClaimsPrincipal principal)
    {
        var isTestAgent =
            principal.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.Role && c.Value == "Application.TestAgent"
            ) != null;

        if (Guid.TryParse(principal.GetObjectId(), out var userId))
        {
            if (isTestAgent)
            {
                return new User(userId, "Test Agent", "");
            }

            var email = principal.FindFirstValue(ClaimConstants.PreferredUserName);
            try
            {
                if (email != null)
                {
                    _ = new MailAddress(email);
                }
            }
            catch
            {
                email = ""; // it doesn't really matter if preferred user name is not an email
            }

            return new User(
                userId,
                principal.FindFirstValue(ClaimConstants.Name) ?? "",
                email ?? ""
            );
        }

        return null;
    }
}
