namespace BingoTodo.Features.Users.Services;

using BingoTodo.Features.Users.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

public class UserService
{
    private readonly IMongoCollection<User> _usersCollection;

    public UserService(IOptions<Common.Models.MongoDatabaseSettings> mongoDatabaseSettings)
    {
        var mongoClient = new MongoClient(mongoDatabaseSettings.Value.ConnectionString);

        var mongoDatabase = mongoClient.GetDatabase(mongoDatabaseSettings.Value.DatabaseName);

        _usersCollection = mongoDatabase.GetCollection<User>("Users");
    }

    public async Task<User?> GetAsync(Guid id) =>
        await _usersCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task CreateOrUpdateAsync(User user, CancellationToken cancellationToken)
    {
        var state = await GetAsync(user.Id);
        // TODO this should probably live somewhere else
        if (state != null)
        {
            state.Statistics.Board3x3.Created += user.Statistics.Board3x3.Created;
            state.Statistics.Board4x4.Created += user.Statistics.Board4x4.Created;
            state.Statistics.Board5x5.Created += user.Statistics.Board5x5.Created;
        }

        await _usersCollection.ReplaceOneAsync(
            x => x.Id == user.Id,
            state ?? user,
            new ReplaceOptions { IsUpsert = true },
            cancellationToken
        );
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken) =>
        await _usersCollection.DeleteOneAsync(x => x.Id == id, cancellationToken);
}
