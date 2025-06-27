using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Wildblood.Tactics.Models
{
    public class Tactic
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [JsonPropertyName("_id")]
        public string Id { get; set; }

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; }

        // TODO kick it out 
        [BsonElement("userId")]
        [JsonPropertyName("userId")]
        public string UserId { get; set; }

        [BsonElement("folder")]
        [JsonPropertyName("folder")]
        public List<Folder> Folders { get; set; }

        [BsonElement("members")]
        [JsonPropertyName("members")]
        public List<MemberRole> Members { get; set; }
    }
}
