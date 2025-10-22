namespace Wildblood.Tactics.Models;

using System.Text.Json.Serialization;

public record Tactic
{
    [JsonPropertyName("_id")]
    public required string Id { get; set; }

    [JsonPropertyName("name")]
    public required string Name { get; set; }

    // TODO kick it out
    [JsonPropertyName("userId")]
    public required string UserId { get; set; }

    [JsonPropertyName("folder")]
    public required List<Folder> Folders { get; set; }

    [JsonPropertyName("members")]
    public required List<MemberRole> Members { get; set; }
}
