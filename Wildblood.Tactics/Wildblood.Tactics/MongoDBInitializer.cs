namespace Wildblood.Tactics;

using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;

public class MongoDbInitializer(IMongoClient mongoClient, IOptions<MongoDbSettings> settings)
{
    public void Initialize()
    {
        var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
        var collectionName = "Tactics";

        var filter = new BsonDocument("name", collectionName);
        var collection = database.ListCollections(new ListCollectionsOptions { Filter = filter });

        if (collection.Any())
        {
            return;
        }

        database.CreateCollection(collectionName);
    }
}
