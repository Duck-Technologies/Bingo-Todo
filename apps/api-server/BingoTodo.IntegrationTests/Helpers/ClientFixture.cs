namespace BingoTodo.IntegrationTests.Helpers;

using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Identity.Abstractions;
using Microsoft.Identity.Web;
using Xunit;

public sealed class ClientFixture : IAsyncLifetime
{
    public IDownstreamApi api;
    public string? BoardId;
    public DateTime? Deadline;
    public string ClientName = "BingoApiClient";

    public ClientFixture()
    {
        // Get the Token acquirer factory instance. By default it reads an appsettings.json
        // file if it exists in the same folder as the app (make sure that the
        // "Copy to Output Directory" property of the appsettings.json file is "Copy if newer").
        var tokenAcquirerFactory = TokenAcquirerFactory.GetDefaultInstance();

        // Add console logging or other services if you wish
        tokenAcquirerFactory.Services.AddLogging(
            (loggingBuilder) => loggingBuilder.SetMinimumLevel(LogLevel.Warning).AddConsole()
        );

        // Create a downstream API service named 'MyApi' which comes loaded with several
        // utility methods to make HTTP calls to the DownstreamApi configurations found
        // in the "MyWebApi" section of your appsettings.json file.
        tokenAcquirerFactory.Services.AddDownstreamApi(
            ClientName,
            tokenAcquirerFactory.Configuration.GetSection("WebAPI")
        );
        var sp = tokenAcquirerFactory.Build();

        // Extract the downstream API service from the 'tokenAcquirerFactory' service provider.
        api = sp.GetRequiredService<IDownstreamApi>();
    }

    public async ValueTask DisposeAsync()
    {
        await api.DeleteForAppAsync<JsonDocument?>(
            ClientName,
            null,
            options =>
            {
                options.RelativePath = "/users";
            }
        );
    }

    public async ValueTask InitializeAsync() { }
}
