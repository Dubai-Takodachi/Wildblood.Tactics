namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;

public interface ITacticExplorerService
{
    public event Func<Task>? OnTacticChanged;

    public event Func<Entity, Task>? OnPing;

    public Tactic CurrentTactic { get; }

    public Folder CurrentFolder { get; }

    public Slide CurrentSlide { get; }

    public Task SendTacticUpdate();

    public Task SendEntitiesUpdate(
        IEnumerable<Entity>? overwriteEntities, IEnumerable<string>? entityIdsToRemove);

    public Task PingToServer(Entity ping);

    public Tactic? GetTactic(string? id);

    public Task UpdateMap(string mapPath);

    public Task UpdateServerEntities(List<Entity> entities);

    public Folder? GetFolder(Tactic tactic, string folderId);

    public Task UpdateFolderName(Tactic tactic, string folderId, string newName);

    public Slide? GetSlide(Tactic tactic, string folderId, string slideId);

    public Task UpdateSlideName(Tactic tactic, string folderId, string slideId, string newName);

    public Task<Slide?> CreateSlide(Tactic tactic, string folderId);

    public Task UpdateTacticName(Tactic tactic, string newName);

    public Task<Folder?> CreateFolder(Tactic tactic);

    public Task ChangeSlide(Folder folder, Slide slide);

    public Task ChangeTactic(string tacticId);

    public Task UpdateMemberList(Tactic tactic, List<MemberRole> members);

    public string ExportTactic();

    public Task ImportTactic(string jsonData);

    public Task SetLocalTactic(Tactic tactic);
}
