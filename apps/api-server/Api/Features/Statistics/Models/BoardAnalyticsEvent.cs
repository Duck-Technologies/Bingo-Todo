namespace BingoTodo.Features.Statistics.Models;

public enum BoardAnalyticsEvent
{
    CreatedBoard,
    CompletedTodo,
    CompletedTodoAfterTraditional,
    CompletedTraditional,
    FromTodoToTraditionalCompletes,
    FromTodoToTraditionalInProgress,
    FromTodoToTraditionalCompleted,
    FromTraditionalToTodoInProgress,
    FromTraditionalCompletedToTodoInProgress,
    CellCheck,
    CreatedBoardWithUserRegistration,
}
