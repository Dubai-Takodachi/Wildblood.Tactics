namespace Wildblood.Tactics.Models.Tools;

using System.Text.Json.Serialization;

public enum ToolType
{
    AddIcon,
    Move,
    DrawFree,
    DrawLine,
    DrawCurve,
    AddText,
    AddShape,
    Undo,
    Redo,
    Erase,
    Ping,
}