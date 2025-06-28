namespace Wildblood.Tactics.Services;

using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Models;

public interface IHubConnectionService
{
    public IDisposable Register(Func<HubConnection, IDisposable> method);

    public Task UpdateTactic(string id, Tactic tactic, string slideId, string folderId);
}
