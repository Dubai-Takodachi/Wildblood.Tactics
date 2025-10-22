namespace Wildblood.Tactics.Client.Services;

public class TacticMapSelectorService : ITacticMapSelectorService
{
    public event Func<Task>? OnMapChanged;

    public string CurrentMap => tacticExplorerService.CurrentSlide.MapPath ?? string.Empty;

    public List<string> Maps { get; private set; }

    private static string baseMapPath = "wwwroot/ConquerorsBladeData/Maps";

    private readonly ITacticExplorerService tacticExplorerService;

    public TacticMapSelectorService(ITacticExplorerService tacticExplorerService)
    {
        this.tacticExplorerService = tacticExplorerService;

        Maps = Directory.EnumerateFiles(baseMapPath, "*", SearchOption.AllDirectories)
            .Select(f => Path.GetFileName(f)
            .Split('.')[0])
            .ToList();

        this.tacticExplorerService.OnTacticChanged += RefreshMapSelection;
    }

    public async Task UpdateCurrentMap(string map)
    {
        if (tacticExplorerService.CurrentSlide.MapPath != map)
        {
            tacticExplorerService.CurrentSlide.MapPath = map;
            await tacticExplorerService.UpdateMap(CurrentMap);
            await tacticExplorerService.SendTacticUpdate();
        }
    }

    private async Task RefreshMapSelection()
    {
        if (OnMapChanged is not null)
        {
            await OnMapChanged.Invoke();
        }
    }
}
