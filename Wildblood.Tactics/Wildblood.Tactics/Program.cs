using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Wildblood.Tactics.Client.Pages;
using Wildblood.Tactics.Components;
using Wildblood.Tactics.Components.Account;
using Wildblood.Tactics.Data;

namespace Wildblood.Tactics
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // MongoDB stuff
            builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));

            builder.Services.AddSingleton<IMongoClient, MongoClient>(sp =>
            {
                var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
                return new MongoClient(settings.ConnectionString);
            });

            builder.Services.AddScoped(sp =>
            {
                var settings = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
                var client = sp.GetRequiredService<IMongoClient>();
                return client.GetDatabase(settings.DatabaseName);
            });
            
            // Add services to the container.
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents()
                .AddInteractiveWebAssemblyComponents();

            builder.Services.AddCascadingAuthenticationState();
            builder.Services.AddScoped<IdentityUserAccessor>();
            builder.Services.AddScoped<IdentityRedirectManager>();
            builder.Services.AddScoped<AuthenticationStateProvider, PersistingRevalidatingAuthenticationStateProvider>();

            builder.Services.AddAuthentication().AddGoogle(googleOptions =>
            {
                googleOptions.ClientId = builder.Configuration["Google:ClientId"];
                googleOptions.ClientSecret = builder.Configuration["Google:ClientSecret"];
            });

            builder.Services.AddAuthentication(options =>
                {
                    options.DefaultScheme = IdentityConstants.ApplicationScheme;
                    options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
                })
                .AddIdentityCookies();

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));
            builder.Services.AddDatabaseDeveloperPageExceptionFilter();

            builder.Services.AddIdentityCore<ApplicationUser>(options => options.SignIn.RequireConfirmedAccount = true)
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddSignInManager()
                .AddDefaultTokenProviders();

            builder.Services.AddSingleton<IEmailSender<ApplicationUser>, IdentityNoOpEmailSender>();

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseWebAssemblyDebugging();
                app.UseMigrationsEndPoint();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            app.UseStaticFiles();
            app.UseAntiforgery();

            app.MapRazorComponents<App>()
                .AddInteractiveServerRenderMode()
                .AddInteractiveWebAssemblyRenderMode()
                .AddAdditionalAssemblies(typeof(Client._Imports).Assembly);

            // Add additional endpoints required by the Identity /Account Razor components.
            app.MapAdditionalIdentityEndpoints();

            app.Run();
        }
    }

    internal class MongoDbSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
    }
}
