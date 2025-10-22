namespace Wildblood.Tactics.Client.Services;

using System.Collections.Generic;
using System.Threading.Tasks;
using Wildblood.Tactics.Models;

public class TacticMemberListService(IUserService userService, ITacticExplorerService explorerService) : ITacticMemberListService
{
    public List<MemberRole> Members => explorerService.CurrentTactic.Members;

    public async Task<bool> CheckHasAccess()
    {
        return await userService.CheckHasEditAcces(explorerService.CurrentTactic);
    }

    public async Task UpdateMemberList(List<MemberRole> memberList)
    {
        await explorerService.UpdateMemberList(explorerService.CurrentTactic, memberList);
    }
}
