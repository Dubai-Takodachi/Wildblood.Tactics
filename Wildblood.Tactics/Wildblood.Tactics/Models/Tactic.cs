using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Wildblood.Tactics.Models
{
    public class Tactic
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; }

        [BsonElement("folder")]
        public List<Folder> Folders { get; set; }
    }
}
