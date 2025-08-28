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
    }

    public async Task<BoardMongo?> GetAsync(string id) =>
        await _boardsCollection.Find(x => x.Id == id).FirstOrDefaultAsync();

    // public async Task<List<BoardMongo>> GetAllAsync() =>
    //     await _boardsCollection.Find(x => x.Name != "").ToListAsync();

    public async Task CreateAsync(BoardMongo board, CancellationToken cancellationToken) =>
        await _boardsCollection.InsertOneAsync(board, cancellationToken: cancellationToken);

    public async Task UpdateAsync(
        string id,
        BoardMongo updatedBoard,
        CancellationToken cancellationToken
    ) =>
        await _boardsCollection.ReplaceOneAsync(
            x => x.Id == id,
            updatedBoard,
            cancellationToken: cancellationToken
        );

    public async Task RemoveAsync(string id, CancellationToken cancellationToken) =>
        await _boardsCollection.DeleteOneAsync(x => x.Id == id, cancellationToken);
}
