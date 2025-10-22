namespace Wildblood.Tactics.Models;

using System.Text.Json.Serialization;
using Wildblood.Tactics.Entities;

public record Slide
{
    [JsonPropertyName("_id")]
    public required string Id { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    [JsonPropertyName("mapPath")]
    public string? MapPath { get; set; }

    [JsonPropertyName("Entity")]
    public required List<Entity> Entities { get; set; }
}
