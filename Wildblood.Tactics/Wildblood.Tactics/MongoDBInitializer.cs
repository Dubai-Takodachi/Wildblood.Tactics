namespace Wildblood.Tactics
{
    using Microsoft.Extensions.Options;
    using MongoDB.Bson;
    using MongoDB.Driver;

    public class MongoDbInitializer
    {
        private readonly IMongoClient _mongoClient;
        private readonly MongoDbSettings _settings;

        public MongoDbInitializer(IMongoClient mongoClient, IOptions<MongoDbSettings> settings)
        {
            _mongoClient = mongoClient;
            _settings = settings.Value;
        }

        public void Initialize()
        {
            var database = _mongoClient.GetDatabase(_settings.DatabaseName);
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
}
