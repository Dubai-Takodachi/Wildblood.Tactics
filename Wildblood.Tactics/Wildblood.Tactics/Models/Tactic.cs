namespace Wildblood.Tactics.Models;

using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

public record Tactic
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [JsonPropertyName("_id")]
    public required string Id { get; set; }

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public required string Name { get; set; }

    // TODO kick it out
    [BsonElement("userId")]
    [JsonPropertyName("userId")]
    public required string UserId { get; set; }

    [BsonElement("folder")]
    [JsonPropertyName("folder")]
    public required List<Folder> Folders { get; set; }

    [BsonElement("members")]
    [JsonPropertyName("members")]
    public required List<MemberRole> Members { get; set; }
}
