namespace Wildblood.Tactics.Components.MainPage;

using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using Wildblood.Tactics.Entities;
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
            await TacticToolService.InitAsync();

            pixiModule = await JS.InvokeAsync<IJSObjectReference>(
                "import",
                "/js/pixiInterop.js");

            var imageFilePaths = Directory
                .EnumerateFiles(baseUnitPath, "*.*", SearchOption.AllDirectories)
                .Where(file => new[] { ".png", ".jpg", ".jpeg", ".gif", ".bmp" }
                    .Contains(Path.GetExtension(file).ToLower()))
                .Select(file => file.Replace("wwwroot/", string.Empty))
                .ToList();
        }
    }

    private async Task ChangeTool(ToolType tool)
    {
        await UpdateTool(toolType: tool);
    }

    private async Task OnUnitSelected(Unit unit)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { UnitName = unit.Name });
    }

    private async Task OnPingColorChanged(string color)
    {
        var length = color[0] == '#' ? 7 : 6;
        var safeColor = color.Length > length ? color.Substring(0, length) : color;
        await UpdateTool(pingOptions: AllOptions.PingOptions! with { Color = safeColor });
    }

    private async Task OnLineColorChanged(string color)
    {
        await UpdateTool(lineOptions: AllOptions.LineDrawOptions! with { Color = color });
    }

    private async Task OnCurveColorChanged(string color)
    {
        await UpdateTool(curveOptions: AllOptions.CurveDrawOptions! with { Color = color });
    }

    private async Task OnFreeColorChanged(string color)
    {
        await UpdateTool(freeDrawOptions: AllOptions.FreeDrawOptions! with { Color = color });
    }

    private async Task OnShapeOutlineColorChanged(string color)
    {
        await UpdateTool(shapeOptions: AllOptions.ShapeOptions! with { OutlineColor = color });
    }

    private async Task OnShapeFillColorChanged(string color)
    {
        await UpdateTool(shapeOptions: AllOptions.ShapeOptions! with { FillColor = color });
    }

    private async Task OnLineEndChange(LineEnd lineEnd)
    {
        await UpdateTool(lineOptions: AllOptions.LineDrawOptions! with { LineEnd = lineEnd });
    }

    private async Task OnCurveEndChange(LineEnd lineEnd)
    {
        await UpdateTool(curveOptions: AllOptions.CurveDrawOptions! with { LineEnd = lineEnd });
    }

    private async Task OnFreeEndChange(LineEnd lineEnd)
    {
        await UpdateTool(freeDrawOptions: AllOptions.FreeDrawOptions! with { LineEnd = lineEnd });
    }

    private async Task OnLineStyleChange(LineStyle lineStyle)
    {
        await UpdateTool(lineOptions: AllOptions.LineDrawOptions! with { LineStyle = lineStyle });
    }

    private async Task OnCurveStyleChange(LineStyle lineStyle)
    {
        await UpdateTool(curveOptions: AllOptions.CurveDrawOptions! with { LineStyle = lineStyle });
    }

    private async Task OnFreeStyleChange(LineStyle lineStyle)
    {
        await UpdateTool(freeDrawOptions: AllOptions.FreeDrawOptions! with { LineStyle = lineStyle });
    }

    private async Task OnShapeLineStyleChanged(LineStyle lineStyle)
    {
        await UpdateTool(shapeOptions: AllOptions.ShapeOptions! with { OutlineStyle = lineStyle });
    }

    private async Task OnIconSizeChanged(int size)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { IconSize = size });
    }

    private async Task OnLineThicknessChanged(int size)
    {
        await UpdateTool(lineOptions: AllOptions.LineDrawOptions! with { Thickness = size });
    }

    private async Task OnCurveThicknessChanged(int size)
    {
        await UpdateTool(curveOptions: AllOptions.CurveDrawOptions! with { Thickness = size });
    }

    private async Task OnFreeDrawThicknessChanged(int size)
    {
        await UpdateTool(freeDrawOptions: AllOptions.FreeDrawOptions! with { Thickness = size });
    }

    private async Task OnLineEndThicknessChanged(int size)
    {
        await UpdateTool(lineOptions: AllOptions.LineDrawOptions! with { EndSize = size });
    }

    private async Task OnCurveEndThicknessChanged(int size)
    {
        await UpdateTool(curveOptions: AllOptions.CurveDrawOptions! with { EndSize = size });
    }

    private async Task OnFreeDrawEndThicknessChanged(int size)
    {
        await UpdateTool(freeDrawOptions: AllOptions.FreeDrawOptions! with { EndSize = size });
    }

    private async Task OnIconTextOptionsTextChanged(string text)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { LabelOptions = AllOptions.IconOptions.LabelOptions with { Text = text } });
    }

    private async Task OnIconTextOptionsSizeChanged(int size)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { LabelOptions = AllOptions.IconOptions.LabelOptions with { Size = size } });
    }

    private async Task OnIconTextOptionsColorChanged(string color)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { LabelOptions = AllOptions.IconOptions.LabelOptions with { Color = color } });
    }

    private async Task OnIconTextOptionsBackgroundBoolChanged(bool hasBackground)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { LabelOptions = AllOptions.IconOptions.LabelOptions with { HasBackground = hasBackground } });
    }

    private async Task OnIconTextOptionsBackgroundColorChanged(string color)
    {
        await UpdateTool(iconOptions: AllOptions.IconOptions! with { LabelOptions = AllOptions.IconOptions.LabelOptions with { BackgroundColor = color } });
    }

    private async Task OnShapeTypeChanged(ShapeType type)
    {
        await UpdateTool(shapeOptions: AllOptions.ShapeOptions! with { ShapeType = type });
    }

    private async Task OnTextOptionsTextChanged(string text)
    {
        await UpdateTool(textOptions: AllOptions.TextOptions! with { Text = text });
    }

    private async Task OnTextOptionsSizeChanged(int size)
    {
        await UpdateTool(textOptions: AllOptions.TextOptions! with { Size = size });
    }

    private async Task OnTextOptionsColorChanged(string color)
    {
        await UpdateTool(textOptions: AllOptions.TextOptions! with { Color = color });
    }

    private async Task OnTextOptionsBackgroundBoolChanged(bool hasBackground)
    {
        await UpdateTool(textOptions: AllOptions.TextOptions! with { HasBackground = hasBackground });
    }

    private async Task OnTextOptionsBackgroundColorChanged(string color)
    {
        await UpdateTool(textOptions: AllOptions.TextOptions! with { BackgroundColor = color });
    }

    private async Task OnShapeOutlineThicknessChanged(int thickness)
    {
        await UpdateTool(shapeOptions: AllOptions.ShapeOptions! with { OutlineThickness = thickness });
    }

    private async Task UpdateTool(
        ToolType? toolType = null,
        PingOptions? pingOptions = null,
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
            PingOptions = pingOptions,
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
