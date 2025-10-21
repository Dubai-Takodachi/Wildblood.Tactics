namespace Wildblood.Tactics.Services;

using Wildblood.Tactics.Models;

public interface IUserService
{
    public Task<bool> CheckHasEditAcces(Tactic tactic);
    public Task<bool> IsAuthenticated();
    public Task<string> GetCurrentUserName();
}
