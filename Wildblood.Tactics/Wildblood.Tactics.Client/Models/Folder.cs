using System.Text.Json.Serialization;

namespace Wildblood.Tactics.Models
{
    public record Folder
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("slides")]
        public List<Slide> Slides { get; set; }
    }
}
