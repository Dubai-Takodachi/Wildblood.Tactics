namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Models;

public interface IUserService
{
    public Task<bool> CheckHasEditAcces(Tactic tactic);
}
