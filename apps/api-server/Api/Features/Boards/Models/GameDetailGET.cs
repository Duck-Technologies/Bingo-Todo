namespace BingoTodo.Features.Boards.Models;

public class GameDetailGET
{
    public DateTime? CompletedAtUtc { get; set; }
    public string? CompletionReward { get; set; }
    public DateTime? CompletionDeadlineUtc { get; set; }
}

public sealed class TraditionalGameDetailGET : GameDetailGET
{
    public bool CompletedByGameModeSwitch { get; set; } = false;
}
