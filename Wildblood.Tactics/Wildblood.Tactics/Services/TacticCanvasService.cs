namespace Wildblood.Tactics.Services;

using System.Threading;
using Microsoft.Extensions.Logging;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Models.Tools;

public class TacticCanvasService : ITacticCanvasService, IDisposable
{
    public event Func<Task>? OnGameStateChanged;

    public event Func<Task>? OnToolChanged;

    public event Func<Entity, Task>? OnPing;

    public Tactic CurrentTactic => tacticExplorerService.CurrentTactic;

    public Folder CurrentFolder => tacticExplorerService.CurrentFolder;

    public Slide CurrentSlide => tacticExplorerService.CurrentSlide;

    public ToolOptions CurrentOptions => tacticToolService.CurrentOptions;

    private readonly ITacticExplorerService tacticExplorerService;
    private readonly ITacticToolService tacticToolService;
    private readonly ILogger<TacticCanvasService> logger;
    
    private Timer? batchTimer;
    private readonly List<Entity> pendingEntities = new();
    private readonly List<string> pendingRemovedIds = new();
    private readonly SemaphoreSlim batchLock = new(1, 1);
    private const int BatchDelayMs = 300; // 300ms delay for batching rapid updates

    public TacticCanvasService(
        ITacticExplorerService tacticExplorerService,
        ITacticToolService tacticToolService,
        ILogger<TacticCanvasService> logger)
    {
        this.tacticExplorerService = tacticExplorerService;
        this.tacticToolService = tacticToolService;
        this.logger = logger;

        tacticExplorerService.OnTacticChanged += RefreshTactic;
        tacticExplorerService.OnPing += PingToClient;
        tacticToolService.OnToolChanged += RefreshTool;
    }

    public List<Entity> GetRedrawEntities()
    {
        return CurrentSlide.Entities;
    }

    public string GetMap()
    {
        return CurrentSlide.MapPath!;
    }

    private async Task RefreshTactic()
    {
        if (OnGameStateChanged != null)
        {
            await OnGameStateChanged.Invoke();
        }
    }

    private async Task RefreshTool()
    {
        if (OnToolChanged != null)
        {
            await OnToolChanged.Invoke();
        }
    }

    private async Task PingToClient(Entity ping)
    {
        if (OnPing != null)
        {
            await OnPing.Invoke(ping);
        }
    }

    public async Task UpdateEntites(Entity[] entities, string[] removedEntityIds)
    {
        await batchLock.WaitAsync();
        try
        {
            // Update local state immediately for responsive UI
            var combined = CurrentSlide.Entities
                .Where(e => !entities.Any(x => x.Id == e.Id))
                .Concat(entities)
                .Where(e => !removedEntityIds.Contains(e.Id))
                .ToList();

            CurrentSlide.Entities = combined;
            await RefreshTactic();

            // Add to batch for server update
            foreach (var entity in entities)
            {
                // Remove any existing pending update for this entity
                pendingEntities.RemoveAll(e => e.Id == entity.Id);
                pendingEntities.Add(entity);
            }

            foreach (var id in removedEntityIds)
            {
                if (!pendingRemovedIds.Contains(id))
                {
                    pendingRemovedIds.Add(id);
                }
                // Also remove from pending entities if it was just added
                pendingEntities.RemoveAll(e => e.Id == id);
            }

            // Cancel existing timer and start new one
            batchTimer?.Dispose();
            batchTimer = new Timer(async state =>
            {
                await FlushPendingUpdates();
            }, null, BatchDelayMs, Timeout.Infinite);
        }
        finally
        {
            batchLock.Release();
        }
    }

    private async Task FlushPendingUpdates()
    {
        await batchLock.WaitAsync();
        try
        {
            if (pendingEntities.Count == 0 && pendingRemovedIds.Count == 0)
            {
                return;
            }

            var entitiesToSend = pendingEntities.ToArray();
            var idsToRemove = pendingRemovedIds.ToArray();

            pendingEntities.Clear();
            pendingRemovedIds.Clear();

            // Release lock before network operations
            batchLock.Release();

            try
            {
                // Send batched updates to server and SignalR
                await tacticExplorerService.SendEntitiesUpdate(entitiesToSend, idsToRemove);
                await tacticExplorerService.UpdateServerEntities(CurrentSlide.Entities);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error flushing pending entity updates");
            }
            
            return; // Don't release again
        }
        catch
        {
            throw;
        }
        finally
        {
            if (batchLock.CurrentCount == 0)
            {
                batchLock.Release();
            }
        }
    }

    public async Task PingToServer(Entity ping)
    {
        await tacticExplorerService.PingToServer(ping);
    }

    public void Dispose()
    {
        batchTimer?.Dispose();
        batchLock?.Dispose();
        
        tacticExplorerService.OnTacticChanged -= RefreshTactic;
        tacticExplorerService.OnPing -= PingToClient;
        tacticToolService.OnToolChanged -= RefreshTool;
    }
}
