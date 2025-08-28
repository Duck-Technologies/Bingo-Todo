namespace BingoTodo.Features.Boards;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.CustomValidations;
using BingoTodo.Features.Boards.Extensions;
using BingoTodo.Features.Boards.Services;
using Microsoft.AspNetCore.Http.HttpResults;

public class DeleteBoard
{
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapDelete("/{id}", Handle)
            .WithName("BoardDeletion")
            .WithSummary("Deletes an existing board")
            .WithRequestValidation<IdParam>()
            .ProducesProblem(StatusCodes.Status403Forbidden);

    public record Request(string Id);

    private static async Task<Results<Ok, NotFound, ForbidHttpResult>> Handle(
        [AsParameters] IdParam request,
        BoardDataService database,
        BoardSaveService service,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        var board = await database.GetAsync(request.Id);

        if (claimsPrincipal.UserEligibleToProceed(board, out var result) != true)
        {
            return result == false ? TypedResults.Forbid() : TypedResults.NotFound();
        }

        await service.RemoveAsync(request.Id, cancellationToken);

        return TypedResults.Ok();
    }
}
