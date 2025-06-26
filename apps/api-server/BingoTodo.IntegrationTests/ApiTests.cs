using System.Text.Json.Nodes;

namespace BingoTodo.IntegrationTests;


public class ApiTests : IClassFixture<ClientFixture>
{
    ClientFixture clientFixture;

    public ApiTests(ClientFixture clientFixture)
    {
        this.clientFixture = clientFixture;
    }


    [Fact]
    public async Task Test1()
    {
        var result = await clientFixture.api.GetForAppAsync<JsonArray>("MyApi",
            options =>
        {
            options.RelativePath = $"books";
        });
        // Console.WriteLine($"result = {result}");
        Assert.Equal("[]", result.ToString());
    }
}
