namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;

public interface ITacticRepository
{
    public Tactic? GetTactic(string? id);

    public Task UpdateMap(Tactic tactic, string folderId, string slideId, string mapPath);

    public Task CreateIcon(Tactic tactic, string folderId, string slideId, Icon unit);

    public Task UpdateIcon(Tactic tactic, string folderId, string slideId, int iconId, Icon icon);

    public Folder? GetFolder(Tactic tactic, string folderId);

    public Task UpdateFolderName(Tactic tactic, string folderId, string newName);

    public Slide? GetSlide(Tactic tactic, string folderId, string slideId);

    public Task UpdateSlideName(Tactic tactic, string folderId, string slideId, string newName);

    public Task<Slide> CreateSlide(Tactic tactic, string folderId);

    public Task UpdateTacticName(Tactic tactic, string newName);

    public Task<Folder> CreateFolder(Tactic tactic);

    public Task UpdateMemberList(Tactic tactic, List<MemberRole> members);
}
