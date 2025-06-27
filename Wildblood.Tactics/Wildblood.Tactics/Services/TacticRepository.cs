namespace Wildblood.Tactics.Services;

using MongoDB.Bson;
using MongoDB.Driver;
using Wildblood.Tactics.Models;

using Icon = Wildblood.Tactics.Entities.Icon;

public class TacticRepository : ITacticRepository
{
    private readonly IMongoDatabase mongoDatabase;
    private IMongoCollection<Tactic> tactics;

    public TacticRepository(IMongoDatabase mongoDatabase)
    {
        this.mongoDatabase = mongoDatabase;
        this.tactics = mongoDatabase.GetCollection<Tactic>("Tactics");
    }

    public Tactic? GetTactic(string? id) =>
        tactics.Find(t => t.Id == id).FirstOrDefault();

    public async Task UpdateMap(string tacticId, string folderId, string slideId, string mapPath)
    {
        var nav = GetNavigation(tacticId, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].MapPath, mapPath);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    public async Task CreateIcon(string tacticId, string folderId, string slideId, Icon unit)
    {
        var nav = GetNavigation(tacticId, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Push(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Icons, unit);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    public async Task UpdateIcon(string tacticId, string folderId, string slideId, int iconId, Icon icon)
    {
        var nav = GetNavigation(tacticId, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Icons[iconId], icon);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    public Folder? GetFolder(string tacticId, string folderId)
    {
        var tactic = GetTactic(tacticId) ?? throw new Exception("Tactic not found");
        return tactic.Folders
            .FirstOrDefault(f => f.Id == folderId);
    }

    public async Task UpdateFolderName(string tacticId, string folderId, string newName)
    {
        var nav = GetNavigation(tacticId, folderId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    public Slide? GetSlide(string tacticId, string folderId, string slideId)
    {
        var tactic = GetTactic(tacticId) ?? throw new Exception("Tactic not found");
        return tactic.Folders
            .Single(f => f.Id == folderId).Slides
            .Single(s => s.Id == slideId);
    }

    public async Task UpdateSlideName(string tacticId, string folderId, string slideId, string newName)
    {
        var nav = GetNavigation(tacticId, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    public async Task<Slide> CreateSlide(string tacticId, string folderId)
    {
        var newSlide = new Slide
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Slide",
            MapPath = null,
            Icons = [],
        };

        var nav = GetNavigation(tacticId, folderId);
        var filter = CreateFilter(nav.TacticIndex)
            & Builders<Tactic>.Filter.ElemMatch(t => t.Folders, f => f.Id == folderId);
        var update = Builders<Tactic>.Update.Push(t => t.Folders[nav.FolderIndex!.Value].Slides, newSlide);
        await tactics.UpdateOneAsync(filter, update);
        return newSlide;
    }

    public async Task UpdateTacticName(string tacticId, string newName)
    {
        //// TODO currently im always replacing the entire document. Not good.
        var nav = GetNavigation(tacticId);
        var update = Builders<Tactic>.Update.Set(t => t.Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    public async Task<Folder> CreateFolder(string tacticId)
    {
        var newFolder = new Folder
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Folder",
            Slides = [],
        };

        var nav = GetNavigation(tacticId);
        var update = Builders<Tactic>.Update.Push(t => t.Folders, newFolder);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
        return newFolder;
    }

    public async Task UpdateMemberList(string tacticId, List<MemberRole> members)
    {
        var nav = GetNavigation(tacticId);
        var update = Builders<Tactic>.Update.Set(t => t.Members, members);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }

    private static FilterDefinition<Tactic> CreateFilter(string tacticId) =>
        Builders<Tactic>.Filter.Eq(t => t.Id, tacticId);

    private record TacticNavigation
    {
        public required string TacticIndex { get; init; }

        public int? FolderIndex { get; init; }

        public int? SlideIndex { get; init; }
    }

    private TacticNavigation GetNavigation(
        string tacticId, string? folderId = null, string? slideId = null)
    {
        var tactic = GetTactic(tacticId) ?? throw new Exception("Tactic not found");
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
