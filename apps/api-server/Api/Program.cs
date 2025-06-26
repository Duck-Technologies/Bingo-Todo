using System.Text.Json;
using System.Security.Claims;
using Azure.Identity;
using Azure.Core;
using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Bingo_Todo.Models;
using Bingo_Todo.Services;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Configuration.AddEnvironmentVariables(prefix: "OVERRIDE_");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

var cosmosConnectionString = Environment.GetEnvironmentVariable("AZURE_COSMOS_LISTCONNECTIONSTRINGURL");
var cosmosDatabaseName = Environment.GetEnvironmentVariable("MONGO_DB_NAME");
string connectionString = "";

if (cosmosConnectionString is not null)
{
    var scope = Environment.GetEnvironmentVariable("AZURE_COSMOS_SCOPE");

    var tokenProvider = new DefaultAzureCredential(
        new DefaultAzureCredentialOptions
        {
            ManagedIdentityClientId = Environment.GetEnvironmentVariable("AZURE_COSMOS_CLIENTID")
        }
    );

    var accessToken = await tokenProvider.GetTokenAsync(new TokenRequestContext(scopes: [scope]));

    var httpClient = new HttpClient();
    httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken.Token}");
    var response = await httpClient.PostAsync(new Uri(cosmosConnectionString), null);
    var responseBody = await response.Content.ReadAsStringAsync();
    if (response.IsSuccessStatusCode)
    {
        var connectionStrings = JsonSerializer.Deserialize<Dictionary<string, List<Dictionary<string, string>>>>(responseBody);
        connectionString = connectionStrings["connectionStrings"][0]["connectionString"];
    }
    else
    {
        throw new Exception(response.StatusCode + responseBody);
    }
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

// var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
// builder.Services.AddCors(options =>
// {
//     options.AddPolicy(name: MyAllowSpecificOrigins,
//                       policy  =>
//                       {
//                           policy.WithOrigins("http://localhost:4200")
//                           .WithHeaders("Authorization");
//                       });
// });

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
// app.UseCors(MyAllowSpecificOrigins);

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

app.MapGet("/books", async (BooksService booksService, ClaimsPrincipal user) =>
{
    return (await booksService.GetAsync()).ToArray();
})
.WithName("GetBooks").RequireAuthorization();

app.MapGet("/books/test", async (BooksService booksService, ClaimsPrincipal user) =>
{
    return (await booksService.GetAsync()).ToArray().Append<Book>(
        new Book
        {
            BookName = "test",
            Author = user.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value ?? (user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role && c.Value == "Application.TestAgent") != null ? "test" : "unknown")
        }
        );
})
.WithName("GetBooksTest").RequireAuthorization();

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
