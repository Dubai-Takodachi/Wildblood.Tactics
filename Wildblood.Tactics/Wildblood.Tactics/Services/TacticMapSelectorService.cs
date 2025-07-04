namespace Wildblood.Tactics.Services;

public class TacticMapSelectorService : ITacticMapSelectorService
{
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
    }

    public async Task UpdateCurrentMap(string map)
    {
        if (tacticExplorerService.CurrentSlide.MapPath != map)
        {
            tacticExplorerService.CurrentSlide.MapPath = map;
            await tacticExplorerService.UpdateMap(CurrentMap);
            await tacticExplorerService.UpdateServer();
        }
    }
}
