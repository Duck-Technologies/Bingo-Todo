namespace BingoTodo.Features.Statistics.Services;

using BingoTodo.Features.Statistics.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

public class GlobalStatisticsService
{
    private readonly IMongoCollection<Statistics> _analyticsCollection;
    private const int CollectionYear = 2025;

    public GlobalStatisticsService(
        IOptions<Common.Models.MongoDatabaseSettings> mongoDatabaseSettings
    )
    {
        var mongoClient = new MongoClient(mongoDatabaseSettings.Value.ConnectionString);

        var mongoDatabase = mongoClient.GetDatabase(mongoDatabaseSettings.Value.DatabaseName);

        _analyticsCollection = mongoDatabase.GetCollection<Statistics>("Analytics");
    }

    public async Task<Statistics?> GetAsync() =>
        await _analyticsCollection.Find(x => x.Year == CollectionYear).FirstOrDefaultAsync();

    public async Task<DeleteResult> RemoveAsync(CancellationToken cancellationToken)
    {
        return await _analyticsCollection.DeleteOneAsync(
            x => x.Year == CollectionYear,
            cancellationToken: cancellationToken
        );
    }

    public async Task<UpdateResult> Update(
        UpdateDefinition<Statistics> update,
        CancellationToken cancellationToken
    )
    {
        var filter = new FilterDefinitionBuilder<Statistics>().Eq(x => x.Year, CollectionYear);
        return await _analyticsCollection.UpdateOneAsync(
            filter,
            update,
            new UpdateOptions { IsUpsert = true },
            cancellationToken: cancellationToken
        );
    }
}
