namespace Wildblood.Tactics.Models.Tools;

using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ShapeType
{
    Circle,
    Rectangle,
    Polygon,
}