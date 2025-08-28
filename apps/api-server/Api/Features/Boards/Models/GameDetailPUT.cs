namespace BingoTodo.Features.Boards.Models;

public sealed record GameDetailPUT
{
    public string? CompletionReward { get; set; }
    public DateTime? CompletionDeadlineUtc { get; set; }
}
