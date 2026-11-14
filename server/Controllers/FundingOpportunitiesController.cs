using System.ComponentModel.DataAnnotations;
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
    private const int MaxListRows = 1000;
    private readonly AppDbContext _db;

    public FundingOpportunitiesController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/v1/fundingopportunities?q=&category=&includeClosed=false
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<FundingOpportunityResponse>>> GetAll(
        [FromQuery, MaxLength(100)] string? q = null,
        [FromQuery] string? category = null,
        [FromQuery] bool includeClosed = false)
    {
        var query = _db.FundingOpportunities.AsNoTracking();

        if (!includeClosed)
        {
            var now = DateTime.UtcNow;
            query = query.Where(f => f.Status != "Closed" && (f.Deadline == null || f.Deadline >= now));
        }

        var term = q?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(term))
        {
            query = query.Where(f =>
                f.Title.ToLower().Contains(term) ||
                f.PatronName.ToLower().Contains(term) ||
                f.Description.ToLower().Contains(term));
        }

        var ordered = query.OrderByDescending(f => f.CreatedAt);

        if (string.IsNullOrWhiteSpace(category))
        {
            var rows = await ordered.Take(MaxListRows).ToListAsync();
            return Ok(rows.Select(item => item.ToResponse()));
        }

        // Category is a list column; match it case-insensitively in memory, then cap.
        var wanted = category.Trim();
        var all = await ordered.ToListAsync();
        var matched = all
            .Where(f => f.Category != null &&
                        f.Category.Any(c => string.Equals(c, wanted, StringComparison.OrdinalIgnoreCase)))
            .Take(MaxListRows);
        return Ok(matched.Select(item => item.ToResponse()));
    }

    // GET: api/v1/fundingopportunities/categories
    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<ActionResult<string[]>> GetCategories()
    {
        var lists = await _db.FundingOpportunities.AsNoTracking().Select(f => f.Category).ToListAsync();
        return Ok(lists
            .Where(l => l != null)
            .SelectMany(l => l)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct()
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToArray());
    }

    // GET: api/v1/fundingopportunities/{id}
    [HttpGet("{id:guid}")]
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
    [HttpPut("{id:guid}")]
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
        // Npgsql rejects Unspecified for timestamptz, so every stored deadline is UTC.
        target.Deadline = request.Deadline switch
        {
            { Kind: DateTimeKind.Unspecified } d => DateTime.SpecifyKind(d, DateTimeKind.Utc),
            { Kind: DateTimeKind.Local } d => d.ToUniversalTime(),
            var d => d
        };
        target.Status = string.IsNullOrWhiteSpace(request.Status) ? "Open" : request.Status;
        target.ExternalUrl = request.ExternalUrl ?? string.Empty;
    }

    // DELETE: api/v1/fundingopportunities/{id}
    [HttpDelete("{id:guid}")]
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
