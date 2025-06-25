namespace Wildblood.Tactics
{
    using Microsoft.AspNetCore.SignalR;

    public class TacticsHub : Hub
    {
        private static readonly Dictionary<string, string> LockedTactics = new();

        public async Task UpdateTactic(string tacticId, object updatedData, object slideId, object folderId)
        {
            Console.WriteLine($"Received update for tactic {tacticId}: {updatedData}");
            // Broadcast the updated tactic data to all connected clients
            await Clients.Others.SendAsync("ReceiveTacticUpdate", tacticId, updatedData, slideId, folderId);
        }

        public async Task LockTactic(string tacticId, string userId)
        {
            if (!LockedTactics.ContainsKey(tacticId))
            {
                LockedTactics[tacticId] = userId;
                await Clients.Others.SendAsync("ReceiveTacticLock", tacticId, userId);
            }
        }

        public async Task UnlockTactic(string tacticId)
        {
            if (LockedTactics.ContainsKey(tacticId))
            {
                LockedTactics.Remove(tacticId);
                await Clients.Others.SendAsync("ReceiveTacticUnlock", tacticId);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.ConnectionId;
            var lockedTactics = LockedTactics.Where(kvp => kvp.Value == userId).Select(kvp => kvp.Key).ToList();

            foreach (var tacticId in lockedTactics)
            {
                LockedTactics.Remove(tacticId);
                await Clients.Others.SendAsync("ReceiveTacticUnlock", tacticId);
            }

            await base.OnDisconnectedAsync(exception);
        }


    }
}