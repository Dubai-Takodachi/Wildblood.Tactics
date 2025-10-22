using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.AspNetCore.SignalR.Client;
using MudBlazor.Services;
using Wildblood.Tactics.Client;
using Wildblood.Tactics.Client.Services;

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
            
            // Add MudBlazor services
            builder.Services.AddMudServices();
            
            // Add HttpClient for API calls
            builder.Services.AddScoped(sp => new HttpClient
            {
                BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
            });
            
            // Register application services
            builder.Services.AddScoped<IHubConnectionService, HubConnectionService>();
            builder.Services.AddScoped<ITacticToolService, TacticToolService>();
            builder.Services.AddScoped<ITacticExplorerService, TacticExplorerService>();
            builder.Services.AddScoped<ITacticMemberListService, TacticMemberListService>();
            builder.Services.AddScoped<ITacticMapSelectorService, TacticMapSelectorService>();
            builder.Services.AddScoped<ITacticCanvasService, TacticCanvasService>();
            
            await builder.Build().RunAsync();
        }
    }
}
