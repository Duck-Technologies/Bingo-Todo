namespace BingoTodo.Features.Boards.CustomValidations;

using BingoTodo.Features.Boards.Models;
using FluentValidation;

public static class ValidGameModeSwitch
{
    public static IRuleBuilderOptions<BoardPUT, GameMode> IsValidGameModeSwitch(
        this IRuleBuilder<BoardPUT, GameMode> ruleBuilder,
        BoardMongo state
    )
    {
        var allCompleted = state.Cells.All(c => c.CheckedAtUtc != null);
        var message = allCompleted
            ? "'{PropertyName}' can't be changed once all cells are checked."
            : "'{PropertyName}' can't be switched to 'traditional' as the board was already completed in 'traditional' mode and a cell was checked in 'todo' mode.";

        return ruleBuilder
            .Must(gameMode => false)
            .When(board =>
                board.GameMode != state.GameMode
                && (allCompleted || IsSwitchBackToTraditional(board, state))
            )
            .WithMessage(message);
    }

    private static bool IsSwitchBackToTraditional(BoardPUT board, BoardMongo state)
    {
        return board.GameMode == GameMode.traditional
            && state.TraditionalGame.CompletedAtUtc != null
            && state.Cells.Any(c => c.CheckedAtUtc > state.TraditionalGame.CompletedAtUtc);
    }
}
