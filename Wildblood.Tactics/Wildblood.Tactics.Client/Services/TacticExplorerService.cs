namespace Wildblood.Tactics.Client.Services;

using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Models.Messages;

public class TacticExplorerService : ITacticExplorerService
{
    public event Func<Task>? OnTacticChanged;
    public event Func<Entity, Task>? OnPing;

    public Tactic CurrentTactic { get; private set; } = null!;
    public Folder CurrentFolder { get; private set; } = null!;
    public Slide CurrentSlide { get; private set; } = null!;

    private readonly JsonSerializerOptions jsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly IHubConnectionService hubConnectionService;
    private readonly HttpClient httpClient;
    private readonly List<IDisposable> connections = [];

    public TacticExplorerService(
        IHubConnectionService hubConnectionService,
        HttpClient httpClient)
    {
        this.hubConnectionService = hubConnectionService;
        this.httpClient = httpClient;

        connections.Add(
            hubConnectionService.Register(hub => hub.On<string, string, string, object>(
                "UpdateTactic", async (tacticId, folderId, slideId, json) =>
                {
                    if (CurrentTactic != null && tacticId == CurrentTactic.Id)
                    {
                        Console.WriteLine($"Received update for tactic {tacticId}");

                        var message = JsonSerializer.Deserialize<UpdateTacticMessage>(
                            json.ToString()!, jsonOptions);

                        if (message is null)
                        {
                            Console.WriteLine($"couldn't deserialize {nameof(UpdateTacticMessage)}!");
                            return;
                        }

                        CurrentTactic = message.TacticWithoutEntities with
                        {
                            Folders = message.TacticWithoutEntities.Folders.Select(newFolder =>
                            {
                                var currentFolder = CurrentTactic.Folders
                                    .SingleOrDefault(f => f.Id == newFolder.Id);

                                return newFolder with
                                {
                                    Slides = newFolder.Slides.Select(newSlide =>
                                    {
                                        var currentSlide = currentFolder?.Slides
                                            .SingleOrDefault(s => s.Id == newSlide.Id);

                                        return newSlide with
                                        {
                                            Entities = CurrentSlide.Entities ?? new List<Entity>(),
                                        };
                                    }).ToList(),
                                };
                            }).ToList(),
                        };

                        if (slideId == CurrentSlide.Id && folderId == CurrentFolder.Id)
                        {
                            CurrentFolder = CurrentTactic.Folders.Single(folder => folder.Id == folderId);
                            CurrentSlide = CurrentFolder.Slides.Single(slide => slide.Id == slideId);
                        }

                        if (OnTacticChanged != null)
                        {
                            await OnTacticChanged.Invoke();
                        }
                    }
                })));

        connections.Add(
            hubConnectionService.Register(hub => hub.On<string, string, string, object>(
                "UpdateEntities", async (tacticId, folderId, slideId, json) =>
                {
                    Console.WriteLine(
                        "received entity update: " + tacticId + " " + folderId + " " + slideId);

                    if (CurrentTactic != null &&
                        tacticId == CurrentTactic.Id &&
                        folderId == CurrentFolder.Id &&
                        slideId == CurrentSlide.Id)
                    {
                        var message = JsonSerializer.Deserialize<UpdateEntitiesMessage>(
                            json.ToString()!, jsonOptions);

                        if (message is null)
                        {
                            Console.WriteLine($"couldn't deserialize {nameof(UpdateEntitiesMessage)}!");
                            return;
                        }

                        CurrentSlide.Entities = CurrentSlide.Entities
                            .Where(x => !(message.EntityIdsToDelete ?? []).Contains(x.Id))
                            .Where(e => !(message.EntitiesToOverwrite ?? []).Any(x => x.Id == e.Id))
                            .Concat(message.EntitiesToOverwrite ?? [])
                            .ToList();

                        if (OnTacticChanged != null)
                        {
                            await OnTacticChanged.Invoke();
                        }
                    }
                })));

        connections.Add(
            hubConnectionService.Register(hub => hub.On<string, string, string, object>(
                "Ping", async (tacticId, folderId, slideId, json) =>
                {
                    Console.WriteLine("received Ping: " + tacticId + " " + folderId + " " + slideId);

                    if (CurrentTactic != null &&
                        tacticId == CurrentTactic.Id &&
                        folderId == CurrentFolder.Id &&
                        slideId == CurrentSlide.Id)
                    {
                        var entity = JsonSerializer.Deserialize<Entity>(json.ToString()!, jsonOptions);

                        if (entity is null)
                        {
                            Console.WriteLine($"couldn't deserialize {nameof(Entity)}!");
                            return;
                        }

                        if (OnPing != null)
                        {
                            await OnPing.Invoke(entity);
                        }
                    }
                })));
    }

    public async Task SendTacticUpdate()
    {
        var withoutEntities = CurrentTactic with
        {
            Folders = CurrentTactic.Folders.Select(x => x with
            {
                Slides = x.Slides.Select(x => x with { Entities = [] }).ToList(),
            }).ToList(),
        };

        var message = new UpdateTacticMessage { TacticWithoutEntities = withoutEntities };

        await hubConnectionService
            .UpdateTactic(CurrentTactic.Id, CurrentFolder.Id, CurrentSlide.Id, message);
    }

    public async Task SendEntitiesUpdate(
        IEnumerable<Entity>? overwriteEntities, IEnumerable<string>? entityIdsToRemove)
    {
        var message = new UpdateEntitiesMessage
        {
            EntitiesToOverwrite = overwriteEntities?.ToList(),
            EntityIdsToDelete = entityIdsToRemove?.ToList(),
        };

        await hubConnectionService
            .UpdateEntities(CurrentTactic.Id, CurrentFolder.Id, CurrentSlide.Id, message);
    }

    public async Task PingToServer(Entity ping)
    {
        await hubConnectionService.Ping(CurrentTactic.Id, CurrentFolder.Id, CurrentSlide.Id, ping);
    }

    public async Task ChangeTactic(string tacticId)
    {
        var tactic = await GetTacticFromApi(tacticId);

        if (tactic == null)
        {
            return;
        }

        CurrentTactic = tactic;
        CurrentFolder = CurrentTactic.Folders[0];
        CurrentSlide = CurrentFolder.Slides[0];

        if (OnTacticChanged != null)
        {
            await OnTacticChanged.Invoke();
        }
    }

    public Tactic? GetTactic(string? id)
    {
        // For synchronous access, return current tactic if it matches
        if (CurrentTactic != null && CurrentTactic.Id == id)
        {
            return CurrentTactic;
        }
        return null;
    }

    private async Task<Tactic?> GetTacticFromApi(string id)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<Tactic>($"/api/tactics/{id}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching tactic: {ex.Message}");
            return null;
        }
    }

    public async Task UpdateMap(string mapPath)
    {
        var content = new StringContent($"\"{mapPath}\"", Encoding.UTF8, "application/json");
        await httpClient.PutAsync(
            $"/api/tactics/{CurrentTactic.Id}/folders/{CurrentFolder.Id}/slides/{CurrentSlide.Id}/map",
            content);

        if (OnTacticChanged != null)
        {
            await OnTacticChanged.Invoke();
        }
    }

    public async Task UpdateServerEntities(List<Entity> entities)
    {
        await httpClient.PutAsJsonAsync(
            $"/api/tactics/{CurrentTactic.Id}/folders/{CurrentFolder.Id}/slides/{CurrentSlide.Id}/entities",
            entities);
    }

    public Folder? GetFolder(Tactic tactic, string folderId)
    {
        return tactic.Folders.FirstOrDefault(f => f.Id == folderId);
    }

    public async Task UpdateFolderName(Tactic tactic, string folderId, string newName)
    {
        var content = new StringContent($"\"{newName}\"", Encoding.UTF8, "application/json");
        await httpClient.PutAsync($"/api/tactics/{tactic.Id}/folders/{folderId}/name", content);
    }

    public Slide? GetSlide(Tactic tactic, string folderId, string slideId)
    {
        return tactic.Folders
            .Single(f => f.Id == folderId).Slides
            .Single(s => s.Id == slideId);
    }

    public async Task UpdateSlideName(Tactic tactic, string folderId, string slideId, string newName)
    {
        var content = new StringContent($"\"{newName}\"", Encoding.UTF8, "application/json");
        await httpClient.PutAsync(
            $"/api/tactics/{tactic.Id}/folders/{folderId}/slides/{slideId}/name",
            content);
    }

    public async Task<Slide?> CreateSlide(Tactic tactic, string folderId)
    {
        var response = await httpClient.PostAsync(
            $"/api/tactics/{tactic.Id}/folders/{folderId}/slides",
            null);

        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<Slide>();
        }

        return null;
    }

    public async Task UpdateTacticName(Tactic tactic, string newName)
    {
        var content = new StringContent($"\"{newName}\"", Encoding.UTF8, "application/json");
        await httpClient.PutAsync($"/api/tactics/{tactic.Id}/name", content);
    }

    public async Task<Folder?> CreateFolder(Tactic tactic)
    {
        var response = await httpClient.PostAsync($"/api/tactics/{tactic.Id}/folders", null);

        if (response.IsSuccessStatusCode)
        {
            return await response.Content.ReadFromJsonAsync<Folder>();
        }

        return null;
    }

    public async Task ChangeSlide(Folder folder, Slide slide)
    {
        if (CurrentFolder != folder)
        {
            CurrentFolder = folder;
        }

        if (CurrentSlide != slide)
        {
            CurrentSlide = slide;
        }

        if (OnTacticChanged != null)
        {
            await OnTacticChanged.Invoke();
        }

        await SendTacticUpdate();
    }

    public async Task UpdateMemberList(Tactic tactic, List<MemberRole> members)
    {
        await httpClient.PutAsJsonAsync($"/api/tactics/{tactic.Id}/members", members);
    }
}
