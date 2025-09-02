namespace BingoTodo.UnitTests.Helpers;

using System.Net;
using System.Net.Http.Json;

record Response(Dictionary<string, string[]>? errors);

public static class ValidationErrorParser
{
    public static async Task<IDictionary<string, string[]>?> ParseResponseToFluentValidationError(
        HttpResponseMessage response
    )
    {
        if (response.StatusCode == HttpStatusCode.BadRequest)
        {
            return (await response.Content.ReadFromJsonAsync<Response>())?.errors;
        }
        else
        {
            return null;
        }
    }
}
