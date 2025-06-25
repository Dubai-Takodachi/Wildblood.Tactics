using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Client;

namespace Wildblood.Tactics.Client
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            var builder = WebAssemblyHostBuilder.CreateDefault(args);

            builder.Services.AddAuthorizationCore();
            builder.Services.AddCascadingAuthenticationState();
            builder.Services.AddSingleton<AuthenticationStateProvider, PersistentAuthenticationStateProvider>();
            builder.Services.AddSingleton(provider =>
            {
                var hubConnetion = new HubConnectionBuilder()
                    .WithUrl(builder.HostEnvironment.BaseAddress + "tacticsHub")
                    .WithAutomaticReconnect()
                    .Build();

                return hubConnetion;
            });
            await builder.Build().RunAsync();
        }
    }
}
