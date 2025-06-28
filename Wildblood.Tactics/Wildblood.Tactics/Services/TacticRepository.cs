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

    public async Task UpdateMap(Tactic tactic, string folderId, string slideId, string mapPath)
    {
        var nav = GetNavigation(tactic, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].MapPath, mapPath);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public async Task CreateIcon(Tactic tactic, string folderId, string slideId, Icon unit)
    {
        var nav = GetNavigation(tactic, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Push(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Icons, unit);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public async Task UpdateIcon(Tactic tactic, string folderId, string slideId, int iconId, Icon icon)
    {
        var nav = GetNavigation(tactic, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Icons[iconId], icon);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public Folder? GetFolder(Tactic tactic, string folderId)
    {
        return tactic.Folders.FirstOrDefault(f => f.Id == folderId);
    }

    public async Task UpdateFolderName(Tactic tactic, string folderId, string newName)
    {
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
        var nav = GetNavigation(tactic, folderId, slideId);
        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[nav.FolderIndex!.Value].Slides[nav.SlideIndex!.Value].Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public async Task<Slide> CreateSlide(Tactic tactic, string folderId)
    {
        var newSlide = new Slide
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Slide",
            MapPath = null,
            Icons = [],
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
        //// TODO currently im always replacing the entire document. Not good.
        var nav = GetNavigation(tactic);
        var update = Builders<Tactic>.Update.Set(t => t.Name, newName);
        await tactics.UpdateOneAsync(CreateFilter(tactic), update);
    }

    public async Task<Folder> CreateFolder(Tactic tactic)
    {
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

    private static FilterDefinition<Tactic> CreateFilter(Tactic tactic) =>
        Builders<Tactic>.Filter.Eq(t => t.Id, tactic.Id);
    
    public async Task UpdateMemberList(string tacticId, List<MemberRole> members)
    {
        var nav = GetNavigation(tacticId);
        var update = Builders<Tactic>.Update.Set(t => t.Members, members);
        await tactics.UpdateOneAsync(CreateFilter(nav.TacticIndex), update);
    }


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
