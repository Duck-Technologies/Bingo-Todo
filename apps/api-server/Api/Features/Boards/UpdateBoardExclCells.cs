namespace BingoTodo.Features.Boards;

using System.Security.Claims;
using System.Text.Json;
using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards.CustomValidations;
using BingoTodo.Features.Boards.Extensions;
using BingoTodo.Features.Boards.Models;
using BingoTodo.Features.Boards.Services;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;

public class UpdateBoardExclCells
{
    public static void Map(IEndpointRouteBuilder app) =>
        app.MapPut("/{id}", Handle)
            .WithName("BoardUpdateExcludingCells")
            .WithSummary("Updates an existing board excluding the cells")
            .WithRequestValidation<IdParam>()
            .ProducesProblem(StatusCodes.Status403Forbidden);

    private static async Task<Results<Ok, NotFound, ForbidHttpResult, ValidationProblem>> Handle(
        [AsParameters] IdParam request,
        BoardPUT requestBody,
        BoardSaveService saveService,
        BoardDataService database,
        ClaimsPrincipal claimsPrincipal,
        CancellationToken cancellationToken
    )
    {
        var board = await database.GetAsync(request.Id);

        if (claimsPrincipal.UserEligibleToProceed(board, out var result) != true)
        {
            return result == false ? TypedResults.Forbid() : TypedResults.NotFound();
        }

        var validationResult = new BoardPutRequestValidator(board!).Validate(requestBody);
        if (!validationResult.IsValid)
        {
            return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        if (!DidAnythingChange(board!, requestBody))
        {
            return TypedResults.Ok();
        }

        await saveService.UpdateExcludingCellsAsync(request.Id, board!, requestBody, cancellationToken);

        return TypedResults.Ok();
    }

    private static bool DidAnythingChange(BoardMongo board, BoardPUT requestBody)
    {
        var compareAgainst = new BoardPUT
        {
            Name = board!.Name,
            GameMode = board.GameMode,
            Visibility = board.Visibility,
            TraditionalGame = new()
            {
                CompletionDeadlineUtc = board.TraditionalGame.CompletionDeadlineUtc,
                CompletionReward = board.TraditionalGame.CompletionReward,
            },
            TodoGame = new()
            {
                CompletionDeadlineUtc = board.TodoGame.CompletionDeadlineUtc,
                CompletionReward = board.TodoGame.CompletionReward,
            },
        };

        return JsonSerializer.Serialize(compareAgainst) != JsonSerializer.Serialize(requestBody);
    }
}

public class BoardPutRequestValidator : AbstractValidator<BoardPUT>
{
    public BoardPutRequestValidator(BoardMongo state)
    {
        RuleFor(x => x.Name).MaximumLength(200).When(x => x != null);

        RuleFor(x => x.GameMode).IsValidGameModeSwitch(state);

        RuleFor(x => x.TraditionalGame.CompletionReward).MaximumLength(200).When(x => x != null);

        RuleFor(x => x.TodoGame.CompletionReward).MaximumLength(200).When(x => x != null);

        RuleFor(x => x.TraditionalGame.CompletionReward)
            .Null()
            .When(x => x.GameMode == GameMode.todo && state.TraditionalGame.CompletedAtUtc is null);

        RuleFor(x => x.TraditionalGame.CompletionDeadlineUtc)
            .Null()
            .When(x => x.GameMode == GameMode.todo && state.TraditionalGame.CompletedAtUtc is null);

        RuleFor(x => x.TraditionalGame.CompletionDeadlineUtc)
            .GreaterThan(DateTime.Now)
            .When(x =>
                x.TraditionalGame.CompletionDeadlineUtc is not null
                && x.TraditionalGame.CompletionDeadlineUtc
                    != state.TraditionalGame.CompletionDeadlineUtc
            )
            .WithMessage("'{PropertyName}' must be in the future.");

        RuleFor(x => x.TodoGame.CompletionReward)
            .Null()
            .When(x => x.GameMode == GameMode.traditional);

        RuleFor(x => x.TodoGame.CompletionDeadlineUtc)
            .Null()
            .When(x => x.GameMode == GameMode.traditional);

        RuleFor(x => x.TodoGame.CompletionDeadlineUtc)
            .GreaterThan(DateTime.Now)
            .When(x =>
                x.TodoGame.CompletionDeadlineUtc is not null
                && x.TodoGame.CompletionDeadlineUtc != state.TodoGame.CompletionDeadlineUtc
            )
            .WithMessage("'{PropertyName}' must be in the future.");

        RuleFor(x => x.TodoGame)
            .ChildRules(gameDetail =>
            {
                gameDetail
                    .RuleFor(x => x.CompletionReward)
                    .IsValidValueIfCompleted(
                        state.TodoGame.CompletionReward,
                        state.TodoGame.CompletedAtUtc != null,
                        GameMode.todo
                    );

                gameDetail
                    .RuleFor(x => x.CompletionDeadlineUtc)
                    .IsValidValueIfCompleted(
                        state.TodoGame.CompletionDeadlineUtc,
                        state.TodoGame.CompletedAtUtc != null,
                        GameMode.todo
                    );
            });

        RuleFor(x => x.TraditionalGame)
            .ChildRules(gameDetail =>
            {
                gameDetail
                    .RuleFor(x => x.CompletionReward)
                    .IsValidValueIfCompleted(
                        state.TraditionalGame.CompletionReward,
                        state.TraditionalGame.CompletedAtUtc != null,
                        GameMode.traditional
                    );

                gameDetail
                    .RuleFor(x => x.CompletionDeadlineUtc)
                    .IsValidValueIfCompleted(
                        state.TraditionalGame.CompletionDeadlineUtc,
                        state.TraditionalGame.CompletedAtUtc != null,
                        GameMode.traditional
                    );
            });
    }
}
