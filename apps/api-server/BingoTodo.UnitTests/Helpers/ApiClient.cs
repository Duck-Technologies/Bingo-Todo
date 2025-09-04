namespace BingoTodo.UnitTests.Helpers;

using System.Net.Http.Json;
using System.Text.Json;
using BingoTodo.Features.Boards.Models;

public class ApiClient
{
    private JsonSerializerOptions AsPascalCase = new() { PropertyNamingPolicy = null };
    private readonly HttpClient client;
    private readonly CancellationToken cancellationToken;
    private const string baseUrl = "/boards";

    public ApiClient(HttpClient client, CancellationToken cancellationToken)
    {
        this.client = client;
        this.cancellationToken = cancellationToken;
    }

    public async Task<HttpResponseMessage> CheckCells(string id, int[] cellIndexes)
    {
        return await client.PostAsJsonAsync(
            $"{baseUrl}/{id}/CheckCells",
            cellIndexes,
            cancellationToken: cancellationToken
        );
    }

    public async Task<HttpResponseMessage> CheckCells(string id, int?[] cellIndexes)
    {
        return await client.PostAsJsonAsync(
            $"{baseUrl}/{id}/CheckCells",
            cellIndexes,
            cancellationToken: cancellationToken
        );
    }

    public async Task<HttpResponseMessage> CheckCellsWithHeader(
        string id,
        int[] cellIndexes,
        DateTime lastChangeDate
    )
    {
        var request = new HttpRequestMessage
        {
            RequestUri = new Uri($"{client.BaseAddress!.OriginalString}{baseUrl}/{id}/CheckCells"),
            Method = HttpMethod.Post,
            Content = JsonContent.Create(cellIndexes),
        };
        request.Headers.Add("If-Match", $"\"{lastChangeDate.Ticks}\"");
        return await client.SendAsync(request, cancellationToken: cancellationToken);
    }

    public async Task<HttpResponseMessage> CreateBoard(BoardPOST board)
    {
        return await client.PostAsJsonAsync(
            baseUrl,
            board,
            AsPascalCase,
            cancellationToken: cancellationToken
        );
    }

    public async Task<string?> CreateBoardSuccess(BoardPOST board)
    {
        var response = await CreateBoard(board);

        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadFromJsonAsync<SuccessResponse>(
            cancellationToken: cancellationToken
        );

        return content?.Id;
    }

    public async Task<HttpResponseMessage> DeleteBoard(string id)
    {
        return await client.DeleteAsync($"{baseUrl}/{id}", cancellationToken);
    }

    public async Task DeleteBoardSuccess(string id)
    {
        var response = await DeleteBoard(id);
        response.EnsureSuccessStatusCode();
    }

    public async Task<HttpResponseMessage> LoadBoard(string id)
    {
        return await client.GetAsync($"{baseUrl}/{id}", cancellationToken: cancellationToken);
    }

    public async Task<BoardGET?> LoadBoardSuccess(string id)
    {
        var response = await LoadBoard(id);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<BoardGET>(
            cancellationToken: cancellationToken
        );
    }

    public async Task<HttpResponseMessage> UnregisterUser()
    {
        return await client.DeleteAsync("/users", cancellationToken);
    }

    public async Task<HttpResponseMessage> UpdateBoard(string id, BoardPUT board)
    {
        return await client.PutAsJsonAsync(
            $"{baseUrl}/{id}",
            board,
            AsPascalCase,
            cancellationToken: cancellationToken
        );
    }

    public async Task<HttpResponseMessage> UpdateBoardSuccess(string id, BoardPUT board)
    {
        var response = await UpdateBoard(id, board);
        response.EnsureSuccessStatusCode();
        return response;
    }

    public async Task<HttpResponseMessage> UpdateBoardWithHeader(
        string id,
        BoardPUT board,
        DateTime lastChangeDate
    )
    {
        var request = new HttpRequestMessage
        {
            RequestUri = new Uri($"{client.BaseAddress!.OriginalString}{baseUrl}/{id}"),
            Method = HttpMethod.Put,
            Content = JsonContent.Create(board),
        };
        request.Headers.Add("If-Match", $"\"{lastChangeDate.Ticks}\"");
        return await client.SendAsync(request, cancellationToken: cancellationToken);
    }
}
