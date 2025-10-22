namespace Wildblood.Tactics.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using Wildblood.Tactics.Entities;
using Wildblood.Tactics.Models;
using Wildblood.Tactics.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TacticsController : ControllerBase
{
    private readonly IMongoCollection<Tactic> tactics;
    private readonly IUserService userService;

    public TacticsController(IMongoDatabase mongoDatabase, IUserService userService)
    {
        this.tactics = mongoDatabase.GetCollection<Tactic>("Tactics");
        this.userService = userService;
    }

    [HttpGet("{id}")]
    public ActionResult<Tactic> GetTactic(string id)
    {
        var tactic = tactics.Find(t => t.Id == id).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        return Ok(tactic);
    }

    [HttpPut("{id}/name")]
    public async Task<IActionResult> UpdateTacticName(string id, [FromBody] string newName)
    {
        var tactic = tactics.Find(t => t.Id == id).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var update = Builders<Tactic>.Update.Set(t => t.Name, newName);
        await tactics.UpdateOneAsync(t => t.Id == id, update);
        return Ok();
    }

    [HttpPost("{tacticId}/folders")]
    public async Task<ActionResult<Folder>> CreateFolder(string tacticId)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var newFolder = new Folder
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Folder",
            Slides = [],
        };

        var update = Builders<Tactic>.Update.Push(t => t.Folders, newFolder);
        await tactics.UpdateOneAsync(t => t.Id == tacticId, update);
        return Ok(newFolder);
    }

    [HttpPut("{tacticId}/folders/{folderId}/name")]
    public async Task<IActionResult> UpdateFolderName(
        string tacticId, string folderId, [FromBody] string newName)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var folderIndex = tactic.Folders.FindIndex(f => f.Id == folderId);
        if (folderIndex == -1)
        {
            return NotFound();
        }

        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[folderIndex].Name, newName);
        await tactics.UpdateOneAsync(t => t.Id == tacticId, update);
        return Ok();
    }

    [HttpPost("{tacticId}/folders/{folderId}/slides")]
    public async Task<ActionResult<Slide>> CreateSlide(string tacticId, string folderId)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var folderIndex = tactic.Folders.FindIndex(f => f.Id == folderId);
        if (folderIndex == -1)
        {
            return NotFound();
        }

        var newSlide = new Slide
        {
            Id = ObjectId.GenerateNewId().ToString(),
            Name = "New Slide",
            MapPath = null,
            Entities = [],
        };

        var filter = Builders<Tactic>.Filter.Eq(t => t.Id, tacticId)
            & Builders<Tactic>.Filter.ElemMatch(t => t.Folders, f => f.Id == folderId);
        var update = Builders<Tactic>.Update.Push(t => t.Folders[folderIndex].Slides, newSlide);
        await tactics.UpdateOneAsync(filter, update);
        return Ok(newSlide);
    }

    [HttpPut("{tacticId}/folders/{folderId}/slides/{slideId}/name")]
    public async Task<IActionResult> UpdateSlideName(
        string tacticId, string folderId, string slideId, [FromBody] string newName)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var folderIndex = tactic.Folders.FindIndex(f => f.Id == folderId);
        if (folderIndex == -1)
        {
            return NotFound();
        }

        var slideIndex = tactic.Folders[folderIndex].Slides.FindIndex(s => s.Id == slideId);
        if (slideIndex == -1)
        {
            return NotFound();
        }

        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[folderIndex].Slides[slideIndex].Name, newName);
        await tactics.UpdateOneAsync(t => t.Id == tacticId, update);
        return Ok();
    }

    [HttpPut("{tacticId}/folders/{folderId}/slides/{slideId}/map")]
    public async Task<IActionResult> UpdateMap(
        string tacticId, string folderId, string slideId, [FromBody] string mapPath)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var folderIndex = tactic.Folders.FindIndex(f => f.Id == folderId);
        if (folderIndex == -1)
        {
            return NotFound();
        }

        var slideIndex = tactic.Folders[folderIndex].Slides.FindIndex(s => s.Id == slideId);
        if (slideIndex == -1)
        {
            return NotFound();
        }

        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[folderIndex].Slides[slideIndex].MapPath, mapPath);
        await tactics.UpdateOneAsync(t => t.Id == tacticId, update);
        return Ok();
    }

    [HttpPut("{tacticId}/folders/{folderId}/slides/{slideId}/entities")]
    public async Task<IActionResult> UpdateEntities(
        string tacticId, string folderId, string slideId, [FromBody] List<Entity> entities)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var folderIndex = tactic.Folders.FindIndex(f => f.Id == folderId);
        if (folderIndex == -1)
        {
            return NotFound();
        }

        var slideIndex = tactic.Folders[folderIndex].Slides.FindIndex(s => s.Id == slideId);
        if (slideIndex == -1)
        {
            return NotFound();
        }

        var update = Builders<Tactic>.Update
            .Set(t => t.Folders[folderIndex].Slides[slideIndex].Entities, entities);
        await tactics.UpdateOneAsync(t => t.Id == tacticId, update);
        return Ok();
    }

    [HttpPut("{tacticId}/members")]
    public async Task<IActionResult> UpdateMembers(
        string tacticId, [FromBody] List<MemberRole> members)
    {
        var tactic = tactics.Find(t => t.Id == tacticId).FirstOrDefault();
        if (tactic == null)
        {
            return NotFound();
        }

        if (!await userService.CheckHasEditAcces(tactic))
        {
            return Forbid();
        }

        var update = Builders<Tactic>.Update.Set(t => t.Members, members);
        await tactics.UpdateOneAsync(t => t.Id == tacticId, update);
        return Ok();
    }
}
