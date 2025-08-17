namespace Wildblood.Tactics.Components.Pages;

using System.Collections.Generic;
using System.Security.Claims;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.EntityFrameworkCore;
using MudBlazor;
using Wildblood.Tactics.Components.Layout;
using Wildblood.Tactics.Data;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Mappings;
using Wildblood.Tactics.Models;

public partial class UnitSetup(
    AuthenticationStateProvider authenticationStateProvider,
    ApplicationDbContext dbContext,
    IDialogService dialogService)
{
    [Parameter]
    public int RaidId { get; set; } = 0;

    private List<PlayerSetup>? players = null;

    private RaidSetup? currentRaidSetup = null;

    private string currentUserId = null!;

    protected override async Task OnInitializedAsync()
    {
        var authState = await authenticationStateProvider.GetAuthenticationStateAsync();
        currentUserId = authState.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

        if (!string.IsNullOrEmpty(currentUserId))
        {
            currentRaidSetup = await dbContext.RaidSetups
                .Where(raid => raid.Id == RaidId)
                .Where(raid => raid.UserId == currentUserId)
                .FirstOrDefaultAsync();

            if (currentRaidSetup != null)
            {
                players = await dbContext.PlayerSetups
                    .Where(player => player.RaidId == currentRaidSetup.Id)
                    .OrderBy(player => player.Index)
                    .ToListAsync();
            }
        }
    }

    private async Task OnNrChanged(PlayerSetup player, int newValue)
    {
        if (players == null)
        {
            return;
        }

        int newIndex = newValue - 1;

        if (newIndex < 0)
        {
            return;
        }

        var other = players.FirstOrDefault(p => p.Index == newIndex);

        if (other == null)
        {
            var movedPlayer = player with { Index = newIndex };

            players.Remove(player);
            players.Add(movedPlayer);

            dbContext.PlayerSetups.Remove(player);
            dbContext.PlayerSetups.Add(movedPlayer);

            await dbContext.SaveChangesAsync();
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
        dbContext.PlayerSetups.Add(newPlayer);
        dbContext.PlayerSetups.Add(newOther);

        await dbContext.SaveChangesAsync();
    }

    private async Task OnAddButtonClick()
    {
        if (currentRaidSetup is null || players is null)
        {
            return;
        }

        var newPlayer = new PlayerSetup
        {
            Index = FindFirstAvailableIndex(players),
            RaidId = currentRaidSetup.Id,
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

        static int FindFirstAvailableIndex(List<PlayerSetup> players)
        {
            var taken = new HashSet<int>(players.Select(p => p.Index));
            int i = 0;

            while (taken.Contains(i))
            {
                i++;
            }

            return i;
        }
    }

    private async Task OnButtonChangeClick(byte index, PlayerSetup setup)
    {
        if (players is null)
        {
            return;
        }

        var options = new DialogOptions { CloseOnEscapeKey = true };
        var existingUnit = index < setup.Units.Count ? setup.Units[index] : null;

        var parameters = new DialogParameters<UnitSelectionDialog>
        {
            { "selectedUnit", existingUnit },
        };

        var dialog = await dialogService
            .ShowAsync<UnitSelectionDialog>($"{index + 1}", parameters, options);

        var result = await dialog.Result;

        if (result is null || result.Canceled)
        {
            return;
        }

        var player = players.Single(p => p.Index == setup.Index);
        var hasIndex = player.Units.Count > index;

        Action<List<Unit>>? updateAction = result.Data switch
        {
            Unit unit when hasIndex => units => units[index] = unit,
            Unit unit => units => units.Add(unit),
            null when hasIndex => units => units.RemoveAt(index),
            _ => null,
        };

        if (updateAction != null)
        {
            updateAction(player.Units);
            dbContext.PlayerSetups.Update(player);
            await dbContext.SaveChangesAsync();
        }
    }

    private async Task OnDeleteButtonClick(PlayerSetup setup)
    {
        if (players is null)
        {
            return;
        }

        players.Remove(setup);
        dbContext.PlayerSetups.Remove(setup);
        await dbContext.SaveChangesAsync();
    }

    private async Task OnEdit(PlayerSetup setup)
    {
        dbContext.PlayerSetups.Update(setup);
        await dbContext.SaveChangesAsync();
    }

    // For Some Reason it need to have both parameters. Idk why.
    private async Task OnClassChanged(PlayerSetup setup, Classes selectedClass)
    {
        setup.Class = selectedClass;
        dbContext.PlayerSetups.Update(setup);
        await dbContext.SaveChangesAsync();
    }
}