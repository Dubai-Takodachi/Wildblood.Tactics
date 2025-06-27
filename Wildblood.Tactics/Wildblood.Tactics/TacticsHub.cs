namespace Wildblood.Tactics
{
    using Microsoft.AspNetCore.SignalR;

    public class TacticsHub : Hub
    {
        private static readonly Dictionary<string, string> LockedTactics = new();
        private static readonly Dictionary<string, HashSet<string>> TacticUsers = [];

        public async Task UpdateTactic(string tacticId, object updatedData, object slideId, object folderId)
        {
            Console.WriteLine($"Received update for tactic {tacticId}: {updatedData}");
            // Broadcast the updated tactic data to all connected clients
            await Clients.Others.SendAsync("ReceiveTacticUpdate", tacticId, updatedData, slideId, folderId);
        }
    }
}