namespace Wildblood.Tactics.Services;

using Microsoft.AspNetCore.Components.Authorization;
using Wildblood.Tactics.Models;

public class UserService(AuthenticationStateProvider authenticationStateProvider) : IUserService
{
    public async Task<bool> CheckHasEditAcces(Tactic tactic)
    {
        // Local tactics can always be edited
        if (tactic.AccessMode == TacticAccessMode.Local)
        {
            return true;
        }

        // Public tactics can be edited by anyone
        if (tactic.AccessMode == TacticAccessMode.Public)
        {
            return true;
        }

        // Private tactics require authentication and membership
        var name = await GetCurrentUserName();
        return tactic.Members.Any(m => m.Name == name && (m.Roles == Role.Admin || m.Roles == Role.Owner));
    }

    public async Task<bool> IsAuthenticated()
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        return authState.User.Identity?.IsAuthenticated ?? false;
    }

    public async Task<string> GetCurrentUserName()
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        return authState.User.Identity?.Name ?? "Anonymous";
    }
}
