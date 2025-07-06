namespace Wildblood.Tactics.Models.Tools;

using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ToolType
{
    AddIcon,
    Move,
    Resize,
    DrawFree,
    DrawLine,
    DrawCurve,
    AddText,
    AddShape,
    Undo,
    Redo,
    Clear,
    Erase,
}