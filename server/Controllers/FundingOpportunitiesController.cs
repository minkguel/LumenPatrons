using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class FundingOpportunitiesController : ControllerBase
{
    private readonly AppDbContext _db;

    public FundingOpportunitiesController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/v1/fundingopportunities
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<FundingOpportunityResponse>>> GetAll(
        [FromQuery] string? category = null,
        [FromQuery] bool? premiumOnly = null)
    {
        var query = _db.FundingOpportunities.AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(f => f.Category != null && f.Category.Contains(category));

        if (premiumOnly.HasValue)
            query = query.Where(f => f.IsPremiumOnly == premiumOnly.Value);

        var opportunities = await query.AsNoTracking()
            .OrderByDescending(f => f.CreatedAt).ToListAsync();
        return Ok(opportunities.Select(item => item.ToResponse()));
    }

    // GET: api/v1/fundingopportunities/{id}
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<FundingOpportunityResponse>> GetById(Guid id)
    {
        var opportunity = await _db.FundingOpportunities.FindAsync(id);
        if (opportunity == null)
            return NotFound();

        return opportunity.ToResponse();
    }

    // POST: api/v1/fundingopportunities
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<FundingOpportunity>> Create(FundingOpportunity opportunity)
    {
        opportunity.Id = Guid.NewGuid();
        opportunity.CreatedAt = DateTime.UtcNow;

        _db.FundingOpportunities.Add(opportunity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = opportunity.Id }, opportunity);
    }

    // PUT: api/v1/fundingopportunities/{id}
    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, FundingOpportunity opportunity)
    {
        if (id != opportunity.Id)
            return BadRequest();

        _db.Entry(opportunity).State = EntityState.Modified;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _db.FundingOpportunities.AnyAsync(f => f.Id == id))
                return NotFound();
            throw;
        }

        return NoContent();
    }

    // DELETE: api/v1/fundingopportunities/{id}
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var opportunity = await _db.FundingOpportunities.FindAsync(id);
        if (opportunity == null)
            return NotFound();

        _db.FundingOpportunities.Remove(opportunity);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
