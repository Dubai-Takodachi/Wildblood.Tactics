namespace Wildblood.Tactics.Services;

using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Models.Messages;

public interface IHubConnectionService
{
    public IDisposable Register(Func<HubConnection, IDisposable> method);

    public Task UpdateTactic(
        string tacticId, string slideId, string folderId, UpdateTacticMessage message);

    public Task UpdateEntities(
        string tacticId, string slideId, string folderId, UpdateEntitiesMessage message);
}
