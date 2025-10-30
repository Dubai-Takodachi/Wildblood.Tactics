namespace Wildblood.Tactics.Services;

using System.Threading;
using Microsoft.Extensions.Logging;
using Wildblood.Tactics.Mappings;
using Wildblood.Tactics.Models.Tools;

public class TacticToolService : ITacticToolService, IDisposable
{
    public event Func<Task>? OnToolChanged;

    public ToolOptions AllOptions { get; private set; }

    public ToolOptions CurrentOptions { get; private set; }

    private readonly ILogger<TacticToolService> logger;
    private Timer? debounceTimer;
    private ToolType? lastToolType;
    private readonly SemaphoreSlim updateLock = new(1, 1);

    public TacticToolService(ILogger<TacticToolService> logger)
    {
        this.logger = logger;
        AllOptions = CreateDefaultOptions();
        CurrentOptions = CreateCurrentToolOptions();
        lastToolType = AllOptions.Tool;
    }

    public async Task PatchTool(ToolOptions newOptions)
    {
        await updateLock.WaitAsync();
        try
        {
            var toolTypeChanged = newOptions?.Tool != null && newOptions.Tool != lastToolType;
            
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

            if (newOptions?.Tool != null)
            {
                lastToolType = newOptions.Tool;
            }

            CurrentOptions = CreateCurrentToolOptions();

            // Cancel existing timer
            debounceTimer?.Dispose();

            // If tool type changed, fire immediately
            if (toolTypeChanged)
            {
                if (OnToolChanged != null)
                {
                    await OnToolChanged.Invoke();
                }
            }
            else
            {
                // For option changes only, debounce with 50ms delay
                debounceTimer = new Timer(state =>
                {
                    Task.Run(async () =>
                    {
                        try
                        {
                            if (OnToolChanged != null)
                            {
                                await OnToolChanged.Invoke();
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log but don't throw in background callback to prevent unhandled exceptions
                            logger.LogError(ex, "Error invoking OnToolChanged event in debounced callback");
                        }
                    });
                }, null, 50, Timeout.Infinite);
            }
        }
        finally
        {
            updateLock.Release();
        }
    }

    public void Dispose()
    {
        debounceTimer?.Dispose();
        updateLock?.Dispose();
    }

    private ToolOptions CreateCurrentToolOptions()
    {
        var currentBase = new ToolOptions { Tool = AllOptions.Tool };

        return AllOptions.Tool switch
        {
            ToolType.AddIcon => currentBase with { IconOptions = AllOptions.IconOptions },
            ToolType.DrawLine => currentBase with { LineDrawOptions = AllOptions.LineDrawOptions },
            ToolType.DrawCurve => currentBase with { CurveDrawOptions = AllOptions.CurveDrawOptions },
            ToolType.DrawFree => currentBase with { FreeDrawOptions = AllOptions.FreeDrawOptions },
            ToolType.AddText => currentBase with { TextOptions = AllOptions.TextOptions },
            ToolType.AddShape => currentBase with { ShapeOptions = AllOptions.ShapeOptions },
            ToolType.Ping => currentBase with { PingOptions = AllOptions.PingOptions },
            _ => currentBase,
        };
    }

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
