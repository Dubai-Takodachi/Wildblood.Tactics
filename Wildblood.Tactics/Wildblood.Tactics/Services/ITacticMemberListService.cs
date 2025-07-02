namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Models;

public interface ITacticMemberListService
{
    public List<MemberRole> Members { get; }

    public Task UpdateMemberList(List<MemberRole> memberList);

    public Task<bool> CheckHasAccess();
}
