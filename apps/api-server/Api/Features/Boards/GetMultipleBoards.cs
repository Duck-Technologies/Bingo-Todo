// namespace BingoTodo.Features.Boards;

// using System.Security.Claims;
// using BingoTodo.Common.Extensions;
// using BingoTodo.Features.Boards.Models;
// using BingoTodo.Features.Boards.Services;
// using Microsoft.AspNetCore.Http.HttpResults;

// public class GetMultipleBoards
// {
//     public static void Map(IEndpointRouteBuilder app) =>
//         app.MapGet("/", Handle).WithSummary("Gets multiple boards");

//     private static async Task<Results<Ok<BoardGET[]>, ForbidHttpResult>> Handle(
//         BoardDataService database,
//         ClaimsPrincipal claimsPrincipal,
//         CancellationToken cancellationToken
//     )
//     {
//         var userId = claimsPrincipal.ExtractUser().Id;

//         var boards = await database.GetAllAsync(); // get public boards only and or any if it's the user's own

//         return TypedResults.Ok(
//             boards
//                 .Select(board => new BoardGET
//                 {
//                     Id = board.Id,
//                     CreatedBy = board.CreatedBy,
//                     CreatedAtUtc = board.CreatedAtUtc,
//                     LastChangedAtUtc = board.LastChangedAtUtc,
//                     Name = board.Name,
//                     GameMode = board.GameMode,
//                     Cells = board.Cells,
//                     Visibility = board.Visibility,
//                     SwitchedToTodoAfterCompleteDateUtc = board.SwitchedToTodoAfterCompleteDateUtc,
//                     TraditionalGame = board.TraditionalGame,
//                     TodoGame = board.TodoGame,
//                 })
//                 .ToArray()
//         );
//     }
// }
