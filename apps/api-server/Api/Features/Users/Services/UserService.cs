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

    /// <summary>
    /// Creates the User if doesn't exist, in that case sets the Email if available.
    /// Assumes that the update already has the Id set
    /// </summary>
    /// <returns>
    /// null if the user was just created, and the User if it alredy existed
    /// </returns>
    public async Task<User?> CreateOrUpdateAsync(
        UpdateDefinition<User> update,
        User user,
        CancellationToken cancellationToken
    )
    {
        update.Set(x => x.Name, user.Name);

        var filter = new FilterDefinitionBuilder<User>().Eq(x => x.Id, user.Id);
        var state = await _usersCollection.FindOneAndUpdateAsync(
            filter,
            update,
            new() { IsUpsert = true },
            cancellationToken
        );

        if (state?.Id is null && user.Email != null) // user was just created
        {
            var emailsetter = new UpdateDefinitionBuilder<User>();
            await _usersCollection.UpdateOneAsync(
                x => x.Id == user.Id,
                emailsetter.Set(x => x.Email, user.Email)
            );
        }

        return state;
    }

    public async Task<User?> GetAsync(Guid id) =>
        await _usersCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken) =>
        await _usersCollection.DeleteOneAsync(x => x.Id == id, cancellationToken);

    public async Task<UpdateResult> UpdateAsync(
        Guid userId,
        UpdateDefinition<User> update,
        CancellationToken cancellationToken
    )
    {
        var filter = new FilterDefinitionBuilder<User>().Eq(x => x.Id, userId);
        return await _usersCollection.UpdateOneAsync(
            filter,
            update,
            cancellationToken: cancellationToken
        );
    }
}
