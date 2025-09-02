namespace BingoTodo.Features.Boards;

public static class Routes
{
    public static void RegisterBoardsRoutes(this WebApplication app)
    {
        var boardEndpoints = app.MapGroup("/boards")
            .WithTags("Boards")
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .RequireAuthorization();

        CreateBoard.Map(boardEndpoints);
        GetBoardById.Map(boardEndpoints);
        // GetMultipleBoards.Map(boardEndpoints);
        DeleteBoard.Map(boardEndpoints);
        CheckCells.Map(boardEndpoints);
        UpdateBoardExclCells.Map(boardEndpoints);
    }
}
