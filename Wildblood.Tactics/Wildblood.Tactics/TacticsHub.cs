namespace Wildblood.Tactics
{
    using Microsoft.AspNetCore.SignalR;
    using Microsoft.AspNetCore.SignalR.Client;

    public class TacticsHub : Hub
    {
        public async Task UpdateTactic(string tacticId, string folderId, string slideId, object message)
        {
            Console.WriteLine($"Received update for tactic {tacticId}: {message}");
            await Clients.Others.SendAsync("UpdateTactic", tacticId, folderId, slideId, message);
        }

        public async Task UpdateEntities(string tacticId, string folderId, string slideId, object message)
        {
            Console.WriteLine(
                $"Received update for entities {tacticId} {folderId} {slideId}: {message}");
            await Clients.Others.SendAsync("UpdateEntities", tacticId, folderId, slideId, message);
        }
    }
}