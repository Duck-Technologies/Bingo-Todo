namespace BingoTodo.Features.Boards.Models;

public sealed class BoardPOST
{
    public string? Name { get; set; }
    public GameMode GameMode { get; set; }
    public string? CompletionReward { get; set; }
    public DateTime? CompletionDeadlineUtc { get; set; }
    public Visibility Visibility { get; set; }
    public BoardCellPOST[] Cells { get; set; } = [];
}
