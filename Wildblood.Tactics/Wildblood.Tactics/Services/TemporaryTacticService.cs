namespace Wildblood.Tactics.Services;

using System.Text.Json;
using Wildblood.Tactics.Models;

public class TemporaryTacticService : ITemporaryTacticService
{
    public Tactic? CurrentTemporaryTactic { get; private set; }

    public bool IsTemporary => CurrentTemporaryTactic != null;

    public void SetTemporaryTactic(Tactic tactic)
    {
        CurrentTemporaryTactic = tactic;
    }

    public void ClearTemporaryTactic()
    {
        CurrentTemporaryTactic = null;
    }

    public string ExportToJson(Tactic tactic)
    {
        var options = new JsonSerializerOptions
        {
            WriteIndented = true
        };
        return JsonSerializer.Serialize(tactic, options);
    }
}
