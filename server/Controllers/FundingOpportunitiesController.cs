using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Contracts;
using LumenPatrons.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class FundingOpportunitiesController : ControllerBase
{
    private const int MaxImportItems = 500;
    private readonly AppDbContext _db;

    public FundingOpportunitiesController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/v1/fundingopportunities
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<FundingOpportunityResponse>>> GetAll(
        [FromQuery] string? category = null)
    {
        var query = _db.FundingOpportunities.AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(f => f.Category != null && f.Category.Contains(category));

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
    public async Task<ActionResult<FundingOpportunityResponse>> Create(FundingOpportunityRequest request)
    {
        var opportunity = new FundingOpportunity
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
        Apply(opportunity, request);

        _db.FundingOpportunities.Add(opportunity);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = opportunity.Id }, opportunity.ToResponse());
    }

    // PUT: api/v1/fundingopportunities/{id}
    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Update(Guid id, FundingOpportunityRequest request)
    {
        var opportunity = await _db.FundingOpportunities.FindAsync(id);
        if (opportunity == null)
            return NotFound();

        Apply(opportunity, request);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/v1/fundingopportunities/import
    [HttpPost("import")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ImportResult>> Import(
        [FromBody] ImportOpportunityItem?[] items,
        [FromServices] OpportunityImporter importer,
        CancellationToken ct)
    {
        if (items.Length == 0)
            return Problem(statusCode: StatusCodes.Status400BadRequest, detail: "The file contains no opportunities.");
        if (items.Length > MaxImportItems)
            return Problem(statusCode: StatusCodes.Status400BadRequest,
                detail: $"A file can contain at most {MaxImportItems} opportunities.");

        return Ok(await importer.ImportAsync(items, ct));
    }

    private static void Apply(FundingOpportunity target, FundingOpportunityRequest request)
    {
        target.Title = request.Title;
        target.PatronName = request.PatronName;
        target.Category = request.Category ?? new List<string>();
        target.Description = request.Description ?? string.Empty;
        target.Eligibility = request.Eligibility;
        target.EstimatedAmount = request.EstimatedAmount;
        target.Currency = request.Currency;
        target.Deadline = request.Deadline;
        target.Status = string.IsNullOrWhiteSpace(request.Status) ? "Open" : request.Status;
        target.ExternalUrl = request.ExternalUrl ?? string.Empty;
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
