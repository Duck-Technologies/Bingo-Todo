namespace BingoTodo.Features.Boards.Models;

public sealed class BoardGET
{
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
    public string Id { get; set; }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider adding the 'required' modifier or declaring as nullable.
    public Guid CreatedBy { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime LastChangedAtUtc { get; set; }
    public string? Name { get; set; }
    public GameMode GameMode { get; set; }
    public BoardCellGET[] Cells { get; set; } = [];
    public Visibility Visibility { get; set; }
    public DateTime? SwitchedToTodoAfterCompleteDateUtc { get; set; }
    public TraditionalGameDetailGET TraditionalGame { get; set; } = new();
    public GameDetailGET TodoGame { get; set; } = new();
}
