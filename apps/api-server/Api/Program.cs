using BingoTodo.Common.Extensions;
using BingoTodo.Features.Boards;
using BingoTodo.Features.Boards.Services;
using BingoTodo.Features.Statistics.Services;
using BingoTodo.Features.Users;
using BingoTodo.Features.Users.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Configuration.AddEnvironmentVariables(prefix: "OVERRIDE_");
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

await builder.Services.ConfigureMongoDatabaseSettings(
    builder,
    Environment.GetEnvironmentVariable("AZURE_COSMOS_LISTCONNECTIONSTRINGURL"),
    Environment.GetEnvironmentVariable("MONGO_DB_NAME"),
    Environment.GetEnvironmentVariable("AZURE_COSMOS_SCOPE"),
    Environment.GetEnvironmentVariable("AZURE_COSMOS_CLIENTID")
);

builder
    .Services.AddSingleton<BoardDataService>()
    .AddSingleton<BoardSaveService>()
    .AddSingleton<UserService>()
    .AddSingleton(TimeProvider.System)
    .AddSingleton<GlobalStatisticsService>();

var CorsPolicy = "CorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        name: CorsPolicy,
        policy =>
        {
            policy
                .WithOrigins("*")
                .WithMethods(["GET", "POST", "PUT", "HEAD", "DELETE"])
                .WithHeaders(["If-Match", "Authorization", "Content-Type"])
                .WithExposedHeaders(["ETag"]);
        }
    );
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNameCaseInsensitive = false;
    options.SerializerOptions.PropertyNamingPolicy = null; // leave responses PascalCase
});

builder.Services.AddValidatorsFromAssemblyContaining<Program>(
    ServiceLifetime.Scoped,
    filter => filter.ValidatorType != typeof(BoardPutRequestValidator)
);

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // CORS in the deployment scenario of the solution
    // can be handled either on the Container Apps layer or the API Management layer
    app.UseCors(CorsPolicy);
}

app.MapOpenApi();
app.UseHttpsRedirection();
app.RegisterBoardsRoutes();
app.RegisterUsersRoutes();

app.Run();

public partial class Program { }
