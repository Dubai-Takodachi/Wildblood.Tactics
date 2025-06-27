namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;

public interface ITacticRepository
{
    public Tactic? GetTactic(string? id);

    public Task UpdateMap(string tacticId, string folderId, string slideId, string mapPath);

    public Task CreateIcon(string tacticId, string folderId, string slideId, Icon unit);

    public Task UpdateIcon(string tacticId, string folderId, string slideId, int iconId, Icon icon);

    public Folder? GetFolder(string tacticId, string folderId);

    public Task UpdateFolderName(string tacticId, string folderId, string newName);

    public Slide? GetSlide(string tacticId, string folderId, string slideId);

    public Task UpdateSlideName(string tacticId, string folderId, string slideId, string newName);

    public Task<Slide> CreateSlide(string tacticId, string folderId);

    public Task UpdateTacticName(string tacticId, string newName);

    public Task<Folder> CreateFolder(string tacticId);

    public Task UpdateMemberList(string tacticId, List<MemberRole> members);
}
