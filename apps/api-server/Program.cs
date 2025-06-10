using System.Text.Json;
using Azure.Identity;
using Azure.Core;
using Bingo_Todo.Models;
using Bingo_Todo.Services;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var cosmosConnectionString = Environment.GetEnvironmentVariable("AZURE_COSMOS_LISTCONNECTIONSTRINGURL");
var cosmosDatabaseName = Environment.GetEnvironmentVariable("MONGO_DB_NAME");
string connectionString = "";

if (cosmosConnectionString is not null)
{
    var scope = Environment.GetEnvironmentVariable("AZURE_COSMOS_SCOPE");
    var tokenProvider = new DefaultAzureCredential();

    var accessToken = await tokenProvider.GetTokenAsync(new TokenRequestContext(scopes: [scope]));

    var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken.Token}");
    var response = await httpClient.PostAsync(new Uri(cosmosConnectionString), null);
    var responseBody = await response.Content.ReadAsStringAsync();
    var connectionStrings = JsonSerializer.Deserialize<Dictionary<string, List<Dictionary<string, string>>>>(responseBody);
    connectionString = connectionStrings["connectionStrings"][0]["connectionString"];
}

builder.Services.Configure<MongoDatabaseSettings>(options => {
    builder.Configuration.GetSection("MongoDB").Bind(options);

    if (connectionString != "") {
        options.ConnectionString = connectionString;
    }

    if (cosmosDatabaseName is not null) {
        options.DatabaseName = cosmosDatabaseName;
    }
});

builder.Services.AddSingleton<BooksService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapGet("/books", async (BooksService booksService) =>
{
    return (await booksService.GetAsync()).ToArray();
})
.WithName("GetBooks");

app.MapPost("/book", async (BooksService booksService) =>
{
    var book = new Book{
        BookName = "Lord of the Rings",
        Price = 100,
        Category = "Fantasy",
        Author = "J.R.R. Tolkien"
    };
    await booksService.CreateAsync(book);

    return book.Id;
})
.WithName("PostBook");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
