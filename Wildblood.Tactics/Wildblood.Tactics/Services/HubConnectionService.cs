namespace Wildblood.Tactics.Services;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Models.Messages;

public class HubConnectionService : IHubConnectionService, IAsyncDisposable
{
    private HubConnection hubConnection;

    public HubConnectionService(NavigationManager navigationManager)
    {
        hubConnection = new HubConnectionBuilder()
            .WithUrl(navigationManager.ToAbsoluteUri("/tacticsHub"), options =>
            {
                options.HttpMessageHandlerFactory = handler =>
                {
                    if (handler is HttpClientHandler clientHandler)
                    {
                        clientHandler.ServerCertificateCustomValidationCallback =
                            HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
                    }

                    return handler;
                };
            })
            .WithAutomaticReconnect()
            .Build();
    }

    public IDisposable Register(Func<HubConnection, IDisposable> method)
    {
        var connection = method(hubConnection);

        if (hubConnection.State == HubConnectionState.Disconnected)
        {
            hubConnection.StartAsync().GetAwaiter().GetResult();
        }

        return connection;
    }

    public async Task UpdateTactic(
        string tacticId, string slideId, string folderId, UpdateTacticMessage message)
    {
        await hubConnection.SendAsync("UpdateTactic", tacticId, folderId, slideId, message);
    }

    public async Task UpdateEntities(
        string tacticId, string folderId, string slideId, UpdateEntitiesMessage message)
    {
        await hubConnection.SendAsync("UpdateEntities", tacticId, folderId, slideId, message);
    }

    public async ValueTask DisposeAsync()
    {
        if (hubConnection != null)
        {
            await hubConnection.DisposeAsync();
        }
    }
}
