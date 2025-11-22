namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Models;

public interface ITemporaryTacticService
{
    public Tactic? CurrentTemporaryTactic { get; }
    
    public bool IsTemporary { get; }
    
    public void SetTemporaryTactic(Tactic tactic);
    
    public void ClearTemporaryTactic();
    
    public string ExportToJson(Tactic tactic);
}
