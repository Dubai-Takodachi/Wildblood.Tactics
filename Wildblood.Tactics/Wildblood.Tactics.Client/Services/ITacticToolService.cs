namespace Wildblood.Tactics.Client.Services;

using Wildblood.Tactics.Models.Tools;

public interface ITacticToolService
{
    public event Func<Task>? OnToolChanged;

    public ToolOptions AllOptions { get; }

    public ToolOptions CurrentOptions { get; }

    public Task PatchTool(ToolOptions newOptions);
}
