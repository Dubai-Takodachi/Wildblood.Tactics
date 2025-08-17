namespace Wildblood.Tactics.Components.Pages
{
    using System.Security.Claims;
    using Microsoft.AspNetCore.Components;
    using Microsoft.AspNetCore.Components.Authorization;
    using Microsoft.EntityFrameworkCore;
    using MudBlazor;
    using Wildblood.Tactics.Data;
    using Wildblood.Tactics.Entities;

    public partial class RaidSetupPage(
        AuthenticationStateProvider authenticationStateProvider,
        ApplicationDbContext dbContext,
        NavigationManager NavigationManager)
    {
        private string currentUserId = null!;

        private List<RaidSetup> raidSetups { get; set; }

        protected override async Task OnInitializedAsync()
        {
            var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
            currentUserId = authState.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

            if (!string.IsNullOrEmpty(currentUserId))
            {
                raidSetups = await dbContext.RaidSetups
                    .Where(raid => raid.UserId == currentUserId)
                    .OrderBy(raid => raid.Name)
                    .ToListAsync();
            }
        }

        private async Task OnEdit(RaidSetup setup)
        {
            dbContext.RaidSetups.Update(setup);
            await dbContext.SaveChangesAsync();
        }

        private void OnRowClick(DataGridRowClickEventArgs<RaidSetup> args)
        {
            NavigationManager.NavigateTo($"/UnitSetup/{args.Item.Id}");
        }

        private async Task OnCreateClick(int one)
        {
            var newSetup = new RaidSetup
            {
                Name = "New Raid Setup",
                UserId = currentUserId,
            };
            dbContext.RaidSetups.Add(newSetup);
            await dbContext.SaveChangesAsync();
            raidSetups.Add(newSetup);
            NavigationManager.NavigateTo($"/UnitSetup/{newSetup.Id}");
        }
    }
}
