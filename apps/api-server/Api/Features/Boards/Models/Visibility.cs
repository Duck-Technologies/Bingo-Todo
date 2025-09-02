namespace BingoTodo.Features.Boards.Models;

using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Visibility
{
    @public = 0,
    unlisted = 1,
}
