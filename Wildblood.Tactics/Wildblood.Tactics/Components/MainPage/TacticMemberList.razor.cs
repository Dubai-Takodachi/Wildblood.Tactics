namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using MudBlazor;
using Wildblood.Tactics.Components.Layout;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Services;

public partial class TacticMemberList
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticMemberListService TacticMemberListService { get; init; } = default!;

    [Inject]
    private IDialogService DialogService { get; init; } = default!;

    private async Task ShowMemberList()
    {
        if (await TacticMemberListService.CheckHasAccess() is false)
        {
            return;
        }

        var parameters = new DialogParameters<MemberListDialog>
        {
            { "Members", TacticMemberListService.Members },
        };

        var dialog = await DialogService.ShowAsync<MemberListDialog>("Member List", parameters);
        var result = (await dialog.Result)!.Data!;

        if (result is List<MemberRole> newMemberList)
        {
            await TacticMemberListService.UpdateMemberList(newMemberList);
        }
    }
}
