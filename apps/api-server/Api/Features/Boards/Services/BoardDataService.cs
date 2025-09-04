namespace BingoTodo.Features.Boards.Services;

using BingoTodo.Features.Boards.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

public class BoardDataService
{
    private readonly IMongoCollection<BoardMongo> _boardsCollection;

    public BoardDataService(IOptions<Common.Models.MongoDatabaseSettings> mongoDatabaseSettings)
    {
        var mongoClient = new MongoClient(mongoDatabaseSettings.Value.ConnectionString);

        var mongoDatabase = mongoClient.GetDatabase(mongoDatabaseSettings.Value.DatabaseName);

        _boardsCollection = mongoDatabase.GetCollection<BoardMongo>("Boards");
        var userIdIndex = new IndexKeysDefinitionBuilder<BoardMongo>().Ascending(x => x.CreatedBy);
        var indexModel = new CreateIndexModel<BoardMongo>(userIdIndex);
        _boardsCollection.Indexes.CreateOne(indexModel);
    }

    public async Task<List<BoardMongo>> GetAllAsync(Guid userId) =>
        await _boardsCollection.Find(x => x.CreatedBy == userId).ToListAsync();

    public async Task<BoardMongo?> GetAsync(string id) =>
        await _boardsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    public async Task CreateAsync(BoardMongo board, CancellationToken cancellationToken) =>
        await _boardsCollection.InsertOneAsync(board, cancellationToken: cancellationToken);

    public async Task<ReplaceOneResult> UpdateAsync(
        string id,
        BoardMongo updatedBoard,
        DateTime lastChangedAt,
        CancellationToken cancellationToken
    ) =>
        await _boardsCollection.ReplaceOneAsync(
            x => x.Id == id && x.LastChangedAtUtc == lastChangedAt,
            updatedBoard,
            cancellationToken: cancellationToken
        );

    public async Task<DeleteResult> RemoveAllAsync(Guid userId, CancellationToken cancellationToken)
    {
        var filter = new FilterDefinitionBuilder<BoardMongo>().Eq(x => x.CreatedBy, userId);
        return await _boardsCollection.DeleteManyAsync(filter, cancellationToken);
    }

    public async Task<DeleteResult> RemoveAsync(string id, CancellationToken cancellationToken) =>
        await _boardsCollection.DeleteOneAsync(x => x.Id == id, cancellationToken);
}
