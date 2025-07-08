namespace Wildblood.Tactics.Models;

using System.Text.Json.Serialization;
using MongoDB.Bson.Serialization.Attributes;
using Wildblood.Tactics.Entities;

public record Slide
{
    [BsonId]
    [BsonElement("_id")]
    [JsonPropertyName("_id")]
    public required string Id { get; set; }

    [BsonElement("name")]
    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [BsonElement("MapPath")]
    [JsonPropertyName("mapPath")]
    public string? MapPath { get; set; }

    [BsonElement("Entity")]
    [JsonPropertyName("Entity")]
    public required List<Entity> Entities { get; set; }
}
