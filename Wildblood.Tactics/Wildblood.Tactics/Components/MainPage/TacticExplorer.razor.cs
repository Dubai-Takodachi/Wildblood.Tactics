namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using MudBlazor;
using Wildblood.Tactics.Components.Layout;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Services;

public partial class TacticExplorer
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    [Inject]
    private ITacticExplorerService TacticExplorerService { get; init; } = default!;

    [Inject]
    private IDialogService DialogService { get; init; } = null!;

    protected override void OnInitialized()
    {
        TacticExplorerService.OnTacticChanged += RefreshUI;
    }

    private async Task RefreshUI()
    {
        await InvokeAsync(StateHasChanged);
    }

    private async Task OnClickTacticRename()
    {
        var parameters = new DialogParameters<RenameDialog>
        {
            { "Name", TacticExplorerService.CurrentTactic.Name },
        };

        var dialog = await DialogService.ShowAsync<RenameDialog>("Rename", parameters);
        var newName = (await dialog.Result)?.Data?.ToString();

        if (newName != null)
        {
            TacticExplorerService.CurrentTactic.Name = newName;
            await TacticExplorerService.UpdateTacticName(TacticExplorerService.CurrentTactic, newName);
            await TacticExplorerService.UpdateServer();
        }
    }

    private async Task OnAddFolder()
    {
        var newFolder = await TacticExplorerService.CreateFolder(TacticExplorerService.CurrentTactic);

        if (newFolder == null)
        {
            return;
        }

        TacticExplorerService.CurrentTactic.Folders.Add(newFolder);
        await TacticExplorerService.UpdateServer();
    }

    private async Task OnClickFolderRename(string folderID)
    {
        var folder = TacticExplorerService.GetFolder(TacticExplorerService.CurrentTactic, folderID);

        var parameters = new DialogParameters<RenameDialog>
        {
            { "Name", folder!.Name },
        };

        var dialog = await DialogService.ShowAsync<RenameDialog>("Rename", parameters);
        var newName = (await dialog.Result)?.Data?.ToString();

        if (newName != null)
        {
            // it is infact a referece!
            folder.Name = newName;
            await TacticExplorerService.UpdateFolderName(TacticExplorerService.CurrentTactic, folder.Id, newName);
            await TacticExplorerService.UpdateServer();
        }
    }

    private async Task OnAddSlide(string folderID)
    {
        var newSlide = await TacticExplorerService.CreateSlide(TacticExplorerService.CurrentTactic, folderID);

        if (newSlide == null)
        {
            return;
        }

        TacticExplorerService.CurrentTactic.Folders.Single(f => f.Id == folderID).Slides.Add(newSlide);
        await TacticExplorerService.UpdateServer();
    }

    private async Task OnSelectedSlideChange(Slide slide, Folder folder)
    {
        await TacticExplorerService.ChangeSlide(folder, slide);
    }

    private async Task OnClickSlideRename(string slideId, string folderId)
    {
        var slide = TacticExplorerService.GetSlide(TacticExplorerService.CurrentTactic, folderId, slideId);

        var parameters = new DialogParameters<RenameDialog>
        {
            { "Name", slide!.Name },
        };

        var dialog = await DialogService.ShowAsync<RenameDialog>("Rename", parameters);
        var newName = (await dialog.Result)?.Data?.ToString();

        if (newName != null)
        {
            slide.Name = newName;
            await TacticExplorerService.UpdateSlideName(TacticExplorerService.CurrentTactic, folderId, slideId, newName);
            await TacticExplorerService.UpdateServer();
        }
    }
}
