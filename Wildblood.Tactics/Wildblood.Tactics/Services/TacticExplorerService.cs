namespace Wildblood.Tactics.Services;

using System.Text.Json;
using Microsoft.AspNetCore.SignalR.Client;
using MongoDB.Bson;
using MongoDB.Driver;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Models.Messages;

public class TacticExplorerService : ITacticExplorerService
{
    public event Func<Task>? OnTacticChanged;

    public Tactic CurrentTactic { get; private set; } = null!;

    public Folder CurrentFolder { get; private set;  } = null!;

    public Slide CurrentSlide { get; private set; } = null!;

    private readonly JsonSerializerOptions jsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly IMongoDatabase mongoDatabase;
    private readonly IUserService userService;
    private readonly IMongoCollection<Tactic> tactics;
    private readonly List<IDisposable> connections = [];

    public TacticExplorerService(
        IMongoDatabase mongoDatabase,
        IUserService userService)
    {
        this.mongoDatabase = mongoDatabase;
        this.userService = userService;
        this.tactics = mongoDatabase.GetCollection<Tactic>("Tactics");
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
    }

    public async Task SendEntitiesUpdate(
        IEnumerable<Entity>? overwriteEntities, IEnumerable<string>? entityIdsToRemove)
    {
        var message = new UpdateEntitiesMessage
        {
            EntitiesToOverwrite = overwriteEntities?.ToList(),
            EntityIdsToDelete = entityIdsToRemove?.ToList(),
        };

        Console.WriteLine("sending:" + CurrentTactic.Id + " " + CurrentFolder.Id + " " + CurrentSlide.Id);
    }

    public async Task ChangeTactic(string tacticId)
    {
        var tactic = GetTactic(tacticId);

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

    public Tactic? GetTactic(string? id) =>
        tactics.Find(t => t.Id == id).FirstOrDefault();

    public async Task UpdateMap(string mapPath)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return;
        }

        var nav = GetNavigation(CurrentTactic, CurrentFolder.Id, CurrentSlide.Id);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].MapPath, mapPath);
        await tactics.UpdateOneAsync(CreateFilter(CurrentTactic), update);

        if (OnTacticChanged != null)
        {
            await OnTacticChanged.Invoke();
        }
    }

    public async Task UpdateServerEntities(List<Entity> entities)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return;
        }

        var nav = GetNavigation(CurrentTactic, CurrentFolder.Id, CurrentSlide.Id);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Entities, entities);
        await tactics.UpdateOneAsync(CreateFilter(CurrentTactic), update);
    }

    public Folder? GetFolder(Tactic tactic, string folderId)
    {
        return tactic.Folders.FirstOrDefault(f => f.Id == folderId);
    }

    public async Task UpdateFolderName(Tactic tactic, string folderId, string newName)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return;
        }

        var nav = GetNavigation(tactic, folderId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public Slide? GetSlide(Tactic tactic, string folderId, string slideId)
    {
        return tactic.Folders
            .Single(f => f.Id == folderId).Slides
            .Single(s => s.Id == slideId);
    }

    public async Task UpdateSlideName(Tactic tactic, string folderId, string slideId, string newName)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return;
        }

        var nav = GetNavigation(tactic, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public async Task<Slide?> CreateSlide(Tactic tactic, string folderId)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return null;
        }

        var newSlide = new Slide
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Slide",
            MapPath = null,
            Entities = [],
        };

        var nav = GetNavigation(tactic, folderId);
        var filter = CreateFilter(tactic)
            & Builders<Tactic>.Filter.ElemMatch(t => t.Folders, f => f.Id == folderId);
        var update = Builders<Tactic>.Update.Push(t => t.Folders[nav.FolderIndex!.Value].Slides, newSlide);
        await tactics.UpdateOneAsync(filter, update);
        return newSlide;
    }

    public async Task UpdateTacticName(Tactic tactic, string newName)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return;
        }

        var nav = GetNavigation(tactic);
        var update = Builders<Tactic>.Update.Set(t => t.Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public async Task<Folder?> CreateFolder(Tactic tactic)
    {
        if (!await userService.CheckHasEditAcces(CurrentTactic))
        {
            return null;
        }

        var newFolder = new Folder
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Folder",
            Slides = [],
        };

        var nav = GetNavigation(tactic);
        var update = Builders<Tactic>.Update.Push(t => t.Folders, newFolder);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
        return newFolder;
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
        var nav = GetNavigation(tactic);
        var update = Builders<Tactic>.Update.Set(t => t.Members, members);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    private static FilterDefinition<Tactic> CreateFilter(Tactic tactic) =>
        Builders<Tactic>.Filter.Eq(t => t.Id, tactic.Id);

    private record TacticNavigation
    {
        public required string TacticIndex { get; init; }

        public int? FolderIndex { get; init; }

        public int? SlideIndex { get; init; }
    }

    private TacticNavigation GetNavigation(
        Tactic tactic, string? folderId = null, string? slideId = null)
    {
        int? folderIndex = folderId != null
            ? tactic.Folders.FindIndex(f => f.Id == folderId)
            : null;
        int? slideIndex = folderIndex != null && slideId != null
            ? tactic.Folders[folderIndex.Value].Slides.FindIndex(s => s.Id == slideId)
            : null;

        return new TacticNavigation
        {
            TacticIndex = tactic.Id,
            FolderIndex = folderIndex,
            SlideIndex = slideIndex,
        };
    }
}
