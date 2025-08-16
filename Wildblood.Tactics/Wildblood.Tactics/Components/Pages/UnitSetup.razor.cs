namespace Wildblood.Tactics.Components.Pages;

using System.Security.Claims;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using MudBlazor;
using Org.BouncyCastle.Asn1.IsisMtt.X509;
using Wildblood.Tactics.Components.Layout;
using Wildblood.Tactics.Data;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Mappings;

public partial class UnitSetup(
    AuthenticationStateProvider authenticationStateProvider,
    ApplicationDbContext dbContext,
    IDialogService dialogService)
{
    private List<PlayerSetup> players = null!;

    private string currentUserId = null!;

    private int Influence { get; set; } = 700;


    protected override async Task OnInitializedAsync()
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        currentUserId = authState.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

        if (!string.IsNullOrEmpty(currentUserId))
        {
            players = await dbContext.PlayerSetups
                .Where(p => p.UserId == currentUserId)
                .OrderBy(players => players.Index)
                .ToListAsync();
        }
    }

    private async Task OnNrChanged(PlayerSetup player, int newValue)
    {
        int newIndex = newValue - 1;

        if (newIndex < 0 || newIndex >= players.Count)
        {
            return;
        }

        var other = players.FirstOrDefault(p => p.Index == newIndex);

        if (player == null || other == null)
        {
            return;
        }

        var newPlayer = player with { Index = other.Index };
        var newOther = other with { Index = player.Index };

        players.Remove(player);
        players.Remove(other);
        players.Add(newPlayer);
        players.Add(newOther);

        dbContext.PlayerSetups.Remove(player);
        dbContext.PlayerSetups.Remove(other);
        dbContext.PlayerSetups.Update(newPlayer);
        dbContext.PlayerSetups.Update(newOther);

        await dbContext.SaveChangesAsync();
    }

    private async Task OnAddButtonClick()
    {
        if (players.Count >= 15)
        {
            return;
        }

        var newPlayer = new PlayerSetup
        {
            Index = players.Count,
            UserId = currentUserId,
            Name = "New Player",
            Class = Models.Classes.Maul,
            Influence = 700,
            Units =
            [
                UnitDataSet.UnitByUnitName[UnitName.Alchemists],
                UnitDataSet.UnitByUnitName[UnitName.ArcherMilitia],
                UnitDataSet.UnitByUnitName[UnitName.ArmingerLancers],
                UnitDataSet.UnitByUnitName[UnitName.AxeRaiders],
            ],
        };

        players.Add(newPlayer);
        dbContext.PlayerSetups.Add(newPlayer);
        await dbContext.SaveChangesAsync();
    }

    private async Task OnButtonChangeClick(byte index, PlayerSetup setup)
    {

        var options = new DialogOptions { CloseOnEscapeKey = true };
        Unit value = null;

        if (index < setup.Units.Count)
        {
            value = setup.Units[index];
        }

        var parameters = new DialogParameters<UnitSelectionDialog>
        {
            { "selectedUnit", value },
        };

        var dialog = await dialogService
            .ShowAsync<UnitSelectionDialog>($"{index + 1}", parameters, options);

        var result = await dialog.Result;

        if (result is null || result.Canceled)
        {
            return;
        }

        var player = players.Single(p => p.Index == setup.Index);

        // @Nina refactor this if you want. Its hell

        if (result.Data == null && player.Units.Count > index)
        {
            player.Units.RemoveAt(index);
        }
        else if (result.Data is Unit unit && player.Units.Count > index)
        {
            player.Units[index] = unit;
        }
        else if (result.Data is Unit unitToAdd)
        {
            player.Units.Add(unitToAdd);
        }
        else
        {
            return;
        }

        dbContext.PlayerSetups.Update(player);
        await dbContext.SaveChangesAsync();
    }

    private async Task OnDeleteButtonClick(PlayerSetup setup)
    {
        players.Remove(setup);
        dbContext.PlayerSetups.Remove(setup);
        await dbContext.SaveChangesAsync();
    }
}