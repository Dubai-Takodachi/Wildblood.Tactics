namespace Wildblood.Tactics.Services;

using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Models;

public class HubConnectionService
    : IHubConnectionService, IAsyncDisposable
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
        return method(hubConnection);
    }

    public async Task UpdateTactic(string id, Tactic tactic, string slideId, string folderId)
    {
        await hubConnection.SendAsync("UpdateTactic", id, tactic, slideId, folderId);
    }

    public async ValueTask DisposeAsync()
    {
        if (hubConnection != null)
        {
            await hubConnection.DisposeAsync();
        }
    }
}
