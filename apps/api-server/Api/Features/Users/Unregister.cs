namespace BingoTodo.Features.Users;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.Services;
using BingoTodo.Features.Users.Services;
using Microsoft.AspNetCore.Http.HttpResults;

public class Unregister
{
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapDelete("", Handle)
            .WithName("UserUnregister")
            .WithSummary("Removes the user (the caller) and their boards from the system");

    private static async Task<Results<NotFound, Ok>> Handle(
        BoardSaveService saveService,
        UserService userService,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        var user = await userService.GetAsync(claimsPrincipal.ExtractUser()!.Id);

        if (user is null)
        {
            return TypedResults.NotFound();
        }

        await saveService.RemoveAllAsync(user.Id, cancellationToken);

        return TypedResults.Ok();
    }
}
