using LumenPatrons.Api.Auth;
using LumenPatrons.Api.Contracts;
using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/savedopportunities")]
public class SavedOpportunitiesController : ControllerBase
{
    private static readonly string[] AllowedStatuses = { "Saved", "Submitted" };

    private static string? CanonicalStatus(string status) =>
        AllowedStatuses.FirstOrDefault(s => string.Equals(s, status, StringComparison.OrdinalIgnoreCase));

    private readonly AppDbContext _db;

    public SavedOpportunitiesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SavedOpportunityResponse>>> GetMine()
    {
        var userId = User.GetRequiredUserId();
        var saved = await _db.SavedOpportunities.AsNoTracking()
            .Include(item => item.Opportunity)
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.SavedAt).ToListAsync();
        return Ok(saved.Select(item => item.ToResponse()));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SavedOpportunityResponse>> GetById(Guid id)
    {
        var userId = User.GetRequiredUserId();
        var saved = await _db.SavedOpportunities.AsNoTracking()
            .Include(item => item.Opportunity)
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        return saved is null ? NotFound() : Ok(saved.ToResponse());
    }

    [HttpPost]
    public async Task<ActionResult<SavedOpportunityResponse>> Create(CreateSavedOpportunityRequest request)
    {
        var userId = User.GetRequiredUserId();
        var status = CanonicalStatus(request.Status);
        if (status is null)
            return ValidationProblem("Status must be Saved or Submitted.");
        if (!await _db.UserProfiles.AnyAsync(user => user.Id == userId))
            return Conflict("Create your user profile before saving opportunities.");

        var opportunity = await _db.FundingOpportunities.FindAsync(request.FundingOpportunityId);
        if (opportunity is null) return NotFound("Funding opportunity not found.");
        if (await _db.SavedOpportunities.AnyAsync(item => item.UserId == userId &&
                item.FundingOpportunityId == request.FundingOpportunityId))
            return Conflict("This funding opportunity is already saved.");

        var saved = new SavedOpportunity
        {
            Id = Guid.NewGuid(), UserId = userId, FundingOpportunityId = opportunity.Id,
            Opportunity = opportunity, Status = status, SavedAt = DateTime.UtcNow
        };
        _db.SavedOpportunities.Add(saved);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved.ToResponse());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateSavedOpportunityRequest request)
    {
        var userId = User.GetRequiredUserId();
        var status = CanonicalStatus(request.Status);
        if (status is null)
            return ValidationProblem("Status must be Saved or Submitted.");
        var saved = await _db.SavedOpportunities
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (saved is null) return NotFound();
        saved.Status = status;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetRequiredUserId();
        var saved = await _db.SavedOpportunities
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId);
        if (saved is null) return NotFound();
        _db.SavedOpportunities.Remove(saved);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
