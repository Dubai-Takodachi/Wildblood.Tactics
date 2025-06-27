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

        public async Task JoinTactic(string tacticId, string userName)
        {
            lock (TacticUsers)
            {
                if (!TacticUsers.ContainsKey(tacticId))
                    TacticUsers[tacticId] = new HashSet<string>();
                TacticUsers[tacticId].Add(userName);
            }
            Console.WriteLine($"{userName} has joined Tactic: {tacticId}");
            await Clients.Group(tacticId).SendAsync("UserListChanged", TacticUsers[tacticId].ToList());
            await Groups.AddToGroupAsync(Context.ConnectionId, tacticId);
        }

        public async Task LeaveTactic(string tacticId, string userName)
        {
            lock (TacticUsers)
            {
                if (TacticUsers.ContainsKey(tacticId))
                {
                    TacticUsers[tacticId].Remove(userName);
                    if (TacticUsers[tacticId].Count == 0)
                        TacticUsers.Remove(tacticId);
                }
            }
            Console.WriteLine($"{userName} left tactic: {tacticId}");
            await Clients.Group(tacticId).SendAsync("UserListChanged", TacticUsers.ContainsKey(tacticId) ? TacticUsers[tacticId].ToList() : new List<string>());
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, tacticId);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Remove user from all tactic groups
            var userName = Context.User?.Identity?.Name ?? Context.ConnectionId;
            List<string> tacticsToUpdate = new();
            lock (TacticUsers)
            {
                foreach (var kvp in TacticUsers)
                {
                    if (kvp.Value.Remove(userName))
                        tacticsToUpdate.Add(kvp.Key);
                }
                foreach (var tacticId in tacticsToUpdate.Where(id => TacticUsers[id].Count == 0).ToList())
                    TacticUsers.Remove(tacticId);
            }
            foreach (var tacticId in tacticsToUpdate)
            {
                await Clients.Group(tacticId).SendAsync("UserListChanged", TacticUsers.ContainsKey(tacticId) ? TacticUsers[tacticId].ToList() : new List<string>());
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}