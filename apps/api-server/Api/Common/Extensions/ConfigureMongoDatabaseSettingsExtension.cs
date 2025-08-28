namespace BingoTodo.Common.Extensions;

using System.Text.Json;
using Azure.Core;
using Azure.Identity;
using BingoTodo.Common.Models;

public static class ConfigureMongoDatabaseSettingsExtension
{
    public static async Task ConfigureMongoDatabaseSettings(
        this IServiceCollection services,
        WebApplicationBuilder builder,
        string? cosmosConnectionString,
        string? cosmosDatabaseName,
        string? cosmosScope,
        string? cosmosClientId
    )
    {
        string connectionString = "";

        if (cosmosConnectionString is not null)
        {
            if (cosmosClientId is null || cosmosScope is null)
            {
                throw new Exception("Either client id or scope is null.");
            }

            var tokenProvider = new DefaultAzureCredential(
                new DefaultAzureCredentialOptions { ManagedIdentityClientId = cosmosClientId }
            );

            var accessToken = await tokenProvider.GetTokenAsync(
                new TokenRequestContext(scopes: [cosmosScope])
            );

            var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken.Token}");
            var response = await httpClient.PostAsync(new Uri(cosmosConnectionString), null);
            var responseBody = await response.Content.ReadAsStringAsync();
            if (response.IsSuccessStatusCode)
            {
                var connectionStrings = JsonSerializer.Deserialize<
                    Dictionary<string, List<Dictionary<string, string>>>
                >(responseBody);

#pragma warning disable CS8602 // Dereference of a possibly null reference.
                // let it fail if it's null
                connectionString = connectionStrings["connectionStrings"][0]["connectionString"];
#pragma warning restore CS8602 // Dereference of a possibly null reference.
            }
            else
            {
                throw new Exception(response.StatusCode + responseBody);
            }
        }

        services.Configure<MongoDatabaseSettings>(options =>
        {
            builder.Configuration.GetSection("MongoDB").Bind(options);

            if (connectionString != "")
            {
                options.ConnectionString = connectionString;
            }

            if (cosmosDatabaseName is not null)
            {
                options.DatabaseName = cosmosDatabaseName;
            }
        });
    }
}
