namespace BingoTodo.Features.Boards;

using System.Security.Claims;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.CustomValidations;
using BingoTodo.Features.Boards.Extensions;
using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Boards.Services;
using Microsoft.AspNetCore.Http.HttpResults;

public class GetBoardById
{
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapGet("/{id}", Handle)
            .WithName("GetBoardById")
            .WithSummary("Gets a board by id")
            .WithRequestValidation<IdParam>()
            .ProducesProblem(StatusCodes.Status403Forbidden);

    private static async Task<Results<Ok<BoardGET>, NotFound, ForbidHttpResult>> Handle(
        [AsParameters] IdParam request,
        BoardDataService database,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        var board = await database.GetAsync(request.Id);

        if (claimsPrincipal.UserEligibleToView(board, out var result) != true)
        {
            return result == false ? TypedResults.Forbid() : TypedResults.NotFound();
        }

        return TypedResults.Ok(
            new BoardGET
            {
                Id = board!.Id,
                CreatedBy = board.CreatedBy,
                CreatedAtUtc = board.CreatedAtUtc,
                LastChangedAtUtc = board.LastChangedAtUtc,
                Name = board.Name,
                GameMode = board.GameMode,
                Cells = board.Cells,
                Visibility = board.Visibility,
                SwitchedToTodoAfterCompleteDateUtc = board.SwitchedToTodoAfterCompleteDateUtc,
                TraditionalGame = board.TraditionalGame,
                TodoGame = board.TodoGame,
            }
        );
    }
}
