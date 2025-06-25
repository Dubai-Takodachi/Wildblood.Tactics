using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;
using Wildblood.Tactics.Entities;

namespace Wildblood.Tactics.Models
{
    public class Slide
    {
        [BsonId]
        [BsonElement("_id")]
        [JsonPropertyName("_id")]
        public string Id { get; set; }

        [BsonElement("name")]
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [BsonElement("MapPath")]
        [JsonPropertyName("mapPath")]
        public string MapPath { get; set; }

        [BsonElement("Icon")]
        [JsonPropertyName("icon")]
        public List<Icon> Icons { get; set; }

    }
}
