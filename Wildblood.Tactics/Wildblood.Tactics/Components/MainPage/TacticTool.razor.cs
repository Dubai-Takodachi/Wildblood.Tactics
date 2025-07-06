namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Wildblood.Tactics.Models.Tools;
using Wildblood.Tactics.Services;

public partial class TacticTool
{
    [Inject]
    private IJSRuntime JS { get; init; } = default!;

    private IJSObjectReference pixiModule = null!;

    [Inject]
    private ITacticToolService TacticToolService { get; init; } = default!;

    private static string baseUnitPath = "wwwroot/ConquerorsBladeData/Units";

    private static string curveIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><title>vector-curve</title><path d=\"M18.5,2A1.5,1.5 0 0,1 20,3.5A1.5,1.5 0 0,1 18.5,5C18.27,5 18.05,4.95 17.85,4.85L14.16,8.55L14.5,9C16.69,7.74 19.26,7 22,7L23,7.03V9.04L22,9C19.42,9 17,9.75 15,11.04A3.96,3.96 0 0,1 11.04,15C9.75,17 9,19.42 9,22L9.04,23H7.03L7,22C7,19.26 7.74,16.69 9,14.5L8.55,14.16L4.85,17.85C4.95,18.05 5,18.27 5,18.5A1.5,1.5 0 0,1 3.5,20A1.5,1.5 0 0,1 2,18.5A1.5,1.5 0 0,1 3.5,17C3.73,17 3.95,17.05 4.15,17.15L7.84,13.45C7.31,12.78 7,11.92 7,11A4,4 0 0,1 11,7C11.92,7 12.78,7.31 13.45,7.84L17.15,4.15C17.05,3.95 17,3.73 17,3.5A1.5,1.5 0 0,1 18.5,2M11,9A2,2 0 0,0 9,11A2,2 0 0,0 11,13A2,2 0 0,0 13,11A2,2 0 0,0 11,9Z\"/></svg>";
    private static string vectorLineIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><title>vector-line</title><path d=\"M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5\" /></svg>";
    private static string swordsIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><title>sword-cross</title><path d=\"M6.2,2.44L18.1,14.34L20.22,12.22L21.63,13.63L19.16,16.1L22.34,19.28C22.73,19.67 22.73,20.3 22.34,20.69L21.63,21.4C21.24,21.79 20.61,21.79 20.22,21.4L17,18.23L14.56,20.7L13.15,19.29L15.27,17.17L3.37,5.27V2.44H6.2M15.89,10L20.63,5.26V2.44H17.8L13.06,7.18L15.89,10M10.94,15L8.11,12.13L5.9,14.34L3.78,12.22L2.37,13.63L4.84,16.1L1.66,19.29C1.27,19.68 1.27,20.31 1.66,20.7L2.37,21.41C2.76,21.8 3.39,21.8 3.78,21.41L7,18.23L9.44,20.7L10.85,19.29L8.73,17.17L10.94,15Z\" /></svg>";

    private ToolOptions AllOptions => TacticToolService.AllOptions;

    protected override void OnInitialized()
    {
        TacticToolService.OnToolChanged += RefreshUI;
    }

    private async Task RefreshUI()
    {
        await InvokeAsync(StateHasChanged);
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            pixiModule = await JS.InvokeAsync<IJSObjectReference>(
                "import",
                "/js/pixiInterop.js");

            var imageFilePaths = Directory
                .EnumerateFiles(baseUnitPath, "*.*", SearchOption.AllDirectories)
                .Where(file => new[] { ".png", ".jpg", ".jpeg", ".gif", ".bmp" }
                    .Contains(Path.GetExtension(file).ToLower()))
                .Select(file => file.Replace("wwwroot/", string.Empty))
                .ToList();

            await pixiModule.InvokeVoidAsync("default.preLoadIcons");
        }
    }

    private async Task ChangeTool(ToolType tool)
    {
        await UpdateTool(toolType: tool);
    }

    private async Task SelectedUnit(IconType iconType)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { IconType = iconType });
    }

    private async Task OnLineColorChanged(string color)
    {
        await UpdateTool(lineOptions: AllOptions.LineDrawOptions! with { Color = color });
    }

    private async Task OnCurveColorChanged(string color)
    {
        await UpdateTool(curveOptions: AllOptions.CurveDrawOptions! with { Color = color });
    }

    private async Task UpdateTool(
        ToolType? toolType = null,
        IconOptions? iconOptions = null,
        LineOptions? lineOptions = null,
        LineOptions? curveOptions = null,
        LineOptions? freeDrawOptions = null,
        ShapeOptions? shapeOptions = null,
        TextOptions? textOptions = null)
    {
        var toolPatch = new ToolOptions
        {
            Tool = toolType,
            IconOptions = iconOptions,
            LineDrawOptions = lineOptions,
            CurveDrawOptions = curveOptions,
            FreeDrawOptions = freeDrawOptions,
            ShapeOptions = shapeOptions,
            TextOptions = textOptions,
        };

        await TacticToolService.PatchTool(toolPatch);
    }
}
