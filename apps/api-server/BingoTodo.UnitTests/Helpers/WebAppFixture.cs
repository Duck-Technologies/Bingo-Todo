namespace BingoTodo.UnitTests.Helpers;

using System.Runtime.InteropServices;
using System.Threading.Tasks;
using BingoTodo.Common.Models;
using BingoTodo.Features.Statistics.Services;
using BingoTodo.Features.Users.Services;
using EphemeralMongo;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

public sealed class WebAppFixture : IAsyncDisposable
{
    public readonly WebApplicationFactory<Program> TestServerClient;
    private IMongoRunner Runner { get; }
    public UserService UserService { get; private set; }
    public Guid DefaultUserId = Guid.Empty;
    public GlobalStatisticsService StatisticsService { get; private set; }
    public TimeProvider TimeProvider;

    public WebAppFixture()
    {
        Runner = MongoRunner.Run();

        TestServerClient = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            // needed for the Docker execution
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                string buildDir = AppDomain.CurrentDomain.BaseDirectory;
                builder.UseContentRoot(buildDir);
            }

            builder.ConfigureTestServices(services =>
            {
                services
                    .AddAuthentication(TestAuthHandler.AuthenticationScheme)
                    .AddScheme<TestAuthHandlerOptions, TestAuthHandler>(
                        TestAuthHandler.AuthenticationScheme,
                        options => { }
                    );
                services.Configure<MongoDatabaseSettings>(options =>
                {
                    options.ConnectionString = Runner.ConnectionString;
                    options.DatabaseName = "Test";
                });
            });
        });

        using var scope = TestServerClient.Services.CreateScope();
        StatisticsService = scope.ServiceProvider.GetRequiredService<GlobalStatisticsService>();
        UserService = scope.ServiceProvider.GetRequiredService<UserService>();
        TimeProvider = scope.ServiceProvider.GetRequiredService<TimeProvider>();
    }

    public async ValueTask DisposeAsync()
    {
        await StatisticsService.RemoveAsync(CancellationToken.None);
        await UserService.RemoveAsync(DefaultUserId, CancellationToken.None);
        Runner.Dispose();
        TestServerClient.Dispose();
    }
}
