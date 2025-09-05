namespace BingoTodo.Features.Users;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Users.Models;
using BingoTodo.Features.Users.Services;
using Microsoft.AspNetCore.Http.HttpResults;

public class GetUserById
{
    public record IdParam(Guid Id);

    public static void Map(IEndpointRouteBuilder app) =>
        app.MapGet("/{id}", Handle)
            .WithName("GetUserById")
            .WithSummary("Gets a user by id")
            .WithRequestValidation<IdParam>();

    private static async Task<Results<Ok<UserGet>, NotFound>> Handle(
        [AsParameters] IdParam request,
        UserService database,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        var user = await database.GetAsync(request.Id);

        if (user is null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(
            new UserGet
            {
                Id = user.Id,
                Name = user.Name,
                RegisteredAt = user.RegisteredAt,
                Achievements = user.Achievements,
            }
        );
    }
}
