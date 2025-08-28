namespace BingoTodo.Features.Boards.Models;

public sealed class BoardCellGET
{
    public string Name { get; set; } = "";
    public DateTime? CheckedAtUtc { get; set; }
}
