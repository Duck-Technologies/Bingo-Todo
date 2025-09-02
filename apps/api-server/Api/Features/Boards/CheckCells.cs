namespace BingoTodo.Features.Boards;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.CustomValidations;
using BingoTodo.Features.Boards.Extensions;
using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Boards.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

public class CheckCells
{
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapPost("/{id}/CheckCells", Handle)
            .WithName("BoardCellCheckUpdate")
            .WithSummary("Sets CheckedAtUtc of the cells for the given indexes")
            .WithRequestValidation<IdParam>()
            .ProducesProblem(StatusCodes.Status403Forbidden);

    private static async Task<
        Results<NotFound, ForbidHttpResult, Ok, BadRequest<string>, Conflict>
    > Handle(
        [AsParameters] IdParam parameters,
        [FromHeader(Name = "If-Match")] string? ticks,
        int?[] indexes,
        BoardDataService database,
        BoardSaveService saveService,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        if (indexes is null || !indexes.Where(i => i is not null && i >= 0 && i < 25).Any())
        {
            return TypedResults.Ok();
        }

        var board = await database.GetAsync(parameters.Id);

        if (claimsPrincipal.UserEligibleToProceed(board, out var result) != true)
        {
            return result == false ? TypedResults.Forbid() : TypedResults.NotFound();
        }

        if (
            long.TryParse(ticks?.Replace("\"", ""), out var _ticks)
            && _ticks != board!.LastChangedAtUtc.Ticks
        )
        {
            return TypedResults.Conflict();
        }

        if (IsBadRequest(board!, out var msg))
        {
            return TypedResults.BadRequest(msg);
        }

        var isConflict =
            (await saveService.UpdateCellsAsync(parameters.Id, board!, indexes, cancellationToken))
            == "conflict";

        return isConflict ? TypedResults.Conflict() : TypedResults.Ok();
    }

    private static bool IsBadRequest(BoardMongo board, out string message)
    {
        if (board!.TodoGame.CompletedAtUtc != null || board.Cells.All(x => x.CheckedAtUtc != null))
        {
            message = "The board can't be updated as all cells are checked.";
            return true;
        }

        if (board.TraditionalGame.CompletedAtUtc != null && board.GameMode == GameMode.traditional)
        {
            message = "The board can't be updated in this game mode.";
            return true;
        }

        message = "";
        return false;
    }
}
