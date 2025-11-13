namespace Wildblood.Tactics.Services;

using System.Threading;
using Microsoft.Extensions.Logging;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Models.Tools;

/// <summary>
/// Service responsible for managing tactic canvas state and coordinating entity updates.
/// Implements batching to optimize performance when rapidly placing entities (icons/boxes/lines).
/// </summary>
/// <remarks>
/// Performance Optimization Strategy:
/// - Batches entity updates over 300ms window to reduce database writes and SignalR broadcasts
/// - Updates local state immediately for responsive UI
/// - Avoids redundant full canvas redraws by not calling RefreshTactic() on every entity placement
/// - JavaScript side handles local drawing; C# side handles persistence and synchronization
/// </remarks>
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
    
    // Batching infrastructure for entity updates
    private Timer? batchTimer;
    private readonly List<Entity> pendingEntities = new();
    private readonly List<string> pendingRemovedIds = new();
    private readonly SemaphoreSlim batchLock = new(1, 1);
    private const int BatchDelayMs = 300; // 300ms delay provides good balance between responsiveness and efficiency

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

    /// <summary>
    /// Updates entities on the slide with batching to optimize performance.
    /// </summary>
    /// <param name="entities">Entities to add or update</param>
    /// <param name="removedEntityIds">IDs of entities to remove</param>
    /// <remarks>
    /// Performance Strategy:
    /// 1. Updates local state immediately so CurrentSlide.Entities is current
    /// 2. Does NOT call RefreshTactic() to avoid expensive full canvas redraws
    ///    (JavaScript side already drew entities locally in addEntityOnServer)
    /// 3. Batches database and SignalR operations over 300ms window
    /// 4. Thread-safe using SemaphoreSlim to prevent race conditions
    /// 
    /// This eliminates the O(n²) performance issue where each placement would redraw all existing entities.
    /// </remarks>
    public async Task UpdateEntites(Entity[] entities, string[] removedEntityIds)
    {
        await batchLock.WaitAsync();
        try
        {
            // Update local state immediately for data consistency
            // Note: We don't call RefreshTactic() here because the JS side already
            // drew the entities locally in addEntityOnServer(). Calling RefreshTactic()
            // would trigger a full redraw of all entities which is expensive and causes lag.
            var combined = CurrentSlide.Entities
                .Where(e => !entities.Any(x => x.Id == e.Id))
                .Concat(entities)
                .Where(e => !removedEntityIds.Contains(e.Id))
                .ToList();

            CurrentSlide.Entities = combined;

            // Add to batch for server update
            foreach (var entity in entities)
            {
                // Remove any existing pending update for this entity to avoid duplicates
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

            // Cancel existing timer and start new one (batching window resets on each update)
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

    /// <summary>
    /// Flushes batched entity updates to the server and SignalR.
    /// Called automatically after the batch delay window expires.
    /// </summary>
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

            // Release lock before network operations to avoid blocking UI thread
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
        
        // Unsubscribe from events to prevent memory leaks
        tacticExplorerService.OnTacticChanged -= RefreshTactic;
        tacticExplorerService.OnPing -= PingToClient;
        tacticToolService.OnToolChanged -= RefreshTool;
    }
}
