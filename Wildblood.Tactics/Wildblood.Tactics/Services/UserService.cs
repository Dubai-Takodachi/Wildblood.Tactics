namespace Wildblood.Tactics.Services;

using Microsoft.AspNetCore.Components.Authorization;
using Wildblood.Tactics.Models;

public class UserService(AuthenticationStateProvider authenticationStateProvider) : IUserService
{
    public async Task<bool> CheckHasEditAcces(Tactic tactic)
    {
        var name = await GetCurrentUserName();
        return tactic.Members.Any(m => m.Name == name && (m.Roles == Role.Admin || m.Roles == Role.Owner));
    }

    private async Task<string> GetCurrentUserName()
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        return authState.User.Identity?.Name ?? "Unknown";
    }
}
