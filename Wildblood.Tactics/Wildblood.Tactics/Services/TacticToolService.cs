namespace Wildblood.Tactics.Services;

using Blazored.LocalStorage;
using Wildblood.Tactics.Mappings;
using Wildblood.Tactics.Models.Tools;

public class TacticToolService : ITacticToolService
{
    private readonly ILocalStorageService localStorage;

    private bool isInitialized;

    public event Func<Task>? OnToolChanged;

    public ToolOptions AllOptions { get; private set; }

    public ToolOptions CurrentOptions { get; private set; }

    public TacticToolService(ILocalStorageService localStorage)
    {
        this.localStorage = localStorage;
        isInitialized = false;

        AllOptions = CreateDefaultOptions();
        CurrentOptions = ToCurrentSelectedOptions(AllOptions);
    }

    public async Task InitAsync()
    {
        AllOptions = await LoadToolOptions() ?? CreateDefaultOptions();
        isInitialized = true;
    }

    private async Task<ToolOptions?> LoadToolOptions()
    {
        return await localStorage.GetItemAsync<ToolOptions>("toolOptions");
    }

    private async Task SaveToolOptions(ToolOptions options)
    {
        if (isInitialized)
        {
            await localStorage.SetItemAsync("toolOptions", options);
        }
    }

    public async Task PatchTool(ToolOptions newOptions)
    {
        AllOptions = AllOptions with
        {
            Tool = newOptions?.Tool ?? AllOptions.Tool,
            PingOptions = newOptions?.PingOptions ?? AllOptions.PingOptions,
            IconOptions = newOptions?.IconOptions ?? AllOptions.IconOptions,
            LineDrawOptions = newOptions?.LineDrawOptions ?? AllOptions.LineDrawOptions,
            CurveDrawOptions = newOptions?.CurveDrawOptions ?? AllOptions.CurveDrawOptions,
            FreeDrawOptions = newOptions?.FreeDrawOptions ?? AllOptions.FreeDrawOptions,
            ShapeOptions = newOptions?.ShapeOptions ?? AllOptions.ShapeOptions,
            TextOptions = newOptions?.TextOptions ?? AllOptions.TextOptions,
        };

        await SaveToolOptions(AllOptions);

        CurrentOptions = ToCurrentSelectedOptions(AllOptions);

        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }

    private static ToolOptions ToCurrentSelectedOptions(ToolOptions all) => all.Tool switch
    {
        ToolType.AddIcon => new() { Tool = all.Tool, IconOptions = all.IconOptions },
        ToolType.DrawLine => new() { Tool = all.Tool, LineDrawOptions = all.LineDrawOptions },
        ToolType.DrawCurve => new() { Tool = all.Tool, CurveDrawOptions = all.CurveDrawOptions },
        ToolType.DrawFree => new() { Tool = all.Tool, FreeDrawOptions = all.FreeDrawOptions },
        ToolType.AddText => new() { Tool = all.Tool, TextOptions = all.TextOptions },
        ToolType.AddShape => new() { Tool = all.Tool, ShapeOptions = all.ShapeOptions },
        ToolType.Ping => new() { Tool = all.Tool, PingOptions = all.PingOptions },
        _ => new() { Tool = all.Tool },
    };

    private static ToolOptions CreateDefaultOptions()
    {
        var defaultLineOptions = new LineOptions
        {
            Color = "#000000",
            LineStyle = LineStyle.Normal,
            Thickness = 20,
            LineEnd = LineEnd.Normal,
            EndSize = 80,
        };

        var defaultTextOptions = new TextOptions
        {
            Text = string.Empty,
            Size = 120,
            Color = "#000000",
            HasBackground = false,
            BackgroundColor = "#aaaaaa",
        };

        return new ToolOptions
        {
            Tool = ToolType.Ping,
            PingOptions = new PingOptions { Color = "ff0000" },
            IconOptions = new IconOptions
            {
                IconSize = 120,
                UnitName = UnitName.Azaps,
                LabelOptions = defaultTextOptions,
            },
            LineDrawOptions = defaultLineOptions,
            CurveDrawOptions = defaultLineOptions,
            FreeDrawOptions = defaultLineOptions,
            ShapeOptions = new ShapeOptions
            {
                ShapeType = ShapeType.Circle,
                OutlineColor = "#ff0000ff",
                OutlineStyle = LineStyle.Normal,
                OutlineThickness = 20,
                FillColor = "#ff000033",
            },
            TextOptions = defaultTextOptions,
        };
    }
}
