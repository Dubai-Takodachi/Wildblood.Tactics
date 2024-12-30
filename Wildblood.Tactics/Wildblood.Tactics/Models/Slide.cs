using MongoDB.Bson.Serialization.Attributes;
using Wildblood.Tactics.Entities;

namespace Wildblood.Tactics.Models
{
    public class Slide
    {
        [BsonId]
        [BsonElement("_id")]
        public string Id { get; set; }

        [BsonElement("name")]
        public string Name { get; set; }

        [BsonElement("MapPath")]
        public string MapPath { get; set; }

        [BsonElement("Icon")]
        public List<Icon> Icons { get; set; }
        
    }
}
