using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class SavedOpportunitiesController : ControllerBase
{
    private readonly AppDbContext _db;

    public SavedOpportunitiesController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/v1/savedopportunities/user/{userId}
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<SavedOpportunity>>> GetByUserId(Guid userId)
    {
        return await _db.SavedOpportunities
            .Include(s => s.Opportunity)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.SavedAt)
            .ToListAsync();
    }

    // GET: api/v1/savedopportunities/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<SavedOpportunity>> GetById(Guid id)
    {
        var saved = await _db.SavedOpportunities
            .Include(s => s.Opportunity)
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (saved == null)
            return NotFound();

        return saved;
    }

    // POST: api/v1/savedopportunities
    [HttpPost]
    public async Task<ActionResult<SavedOpportunity>> Create(SavedOpportunity saved)
    {
        saved.Id = Guid.NewGuid();
        saved.SavedAt = DateTime.UtcNow;

        _db.SavedOpportunities.Add(saved);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = saved.Id }, saved);
    }

    // PUT: api/v1/savedopportunities/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, SavedOpportunity saved)
    {
        if (id != saved.Id)
            return BadRequest();

        _db.Entry(saved).State = EntityState.Modified;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _db.SavedOpportunities.AnyAsync(s => s.Id == id))
                return NotFound();
            throw;
        }

        return NoContent();
    }

    // DELETE: api/v1/savedopportunities/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var saved = await _db.SavedOpportunities.FindAsync(id);
        if (saved == null)
            return NotFound();

        _db.SavedOpportunities.Remove(saved);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
