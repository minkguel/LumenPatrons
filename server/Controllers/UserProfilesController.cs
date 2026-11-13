using LumenPatrons.Api.Auth;
using LumenPatrons.Api.Contracts;
using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using LumenPatrons.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/userprofiles")]
public class UserProfilesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IAuthIdentityDeleter _authDeleter;

    private readonly ILogger<UserProfilesController> _logger;

    public UserProfilesController(
        AppDbContext db, IAuthIdentityDeleter authDeleter, ILogger<UserProfilesController> logger)
    {
        _db = db;
        _authDeleter = authDeleter;
        _logger = logger;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserProfileResponse>> GetMe()
    {
        var userId = User.GetRequiredUserId();
        var profile = await _db.UserProfiles.AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId);
        return profile is null ? NotFound() : Ok(profile.ToResponse());
    }

    [HttpPut("me")]
    public async Task<ActionResult<UserProfileResponse>> UpsertMe(UpdateUserProfileRequest request)
    {
        var userId = User.GetRequiredUserId();
        var email = User.GetRequiredEmail();
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(user => user.Id == userId);
        if (profile is null)
        {
            // Email is unique. Supabase verified this email for the signed-in user, so a profile
            // with the same email and another Id belongs to a login that no longer exists.
            var stale = await _db.UserProfiles
                .Where(user => user.Email == email && user.Id != userId)
                .ToListAsync();
            if (stale.Count > 0)
            {
                var staleIds = stale.Select(user => user.Id).ToList();
                var staleSaved = await _db.SavedOpportunities
                    .Where(item => staleIds.Contains(item.UserId))
                    .ToListAsync();
                _db.SavedOpportunities.RemoveRange(staleSaved);
                _db.UserProfiles.RemoveRange(stale);
                await _db.SaveChangesAsync();
            }

            profile = new UserProfile { Id = userId, Email = email, FullName = request.FullName,
                UserType = request.UserType, CreatedAt = DateTime.UtcNow };
            _db.UserProfiles.Add(profile);
        }
        else
        {
            profile.Email = email;
            profile.FullName = request.FullName;
            profile.UserType = request.UserType;
        }
        await _db.SaveChangesAsync();
        return Ok(profile.ToResponse());
    }

    [HttpGet("me/export")]
    public async Task<ActionResult<AccountExportResponse>> ExportMe()
    {
        var userId = User.GetRequiredUserId();
        var profile = await _db.UserProfiles.AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == userId);
        if (profile is null) return NotFound();

        var saved = await _db.SavedOpportunities.AsNoTracking()
            .Include(item => item.Opportunity)
            .Where(item => item.UserId == userId)
            .OrderBy(item => item.SavedAt)
            .ToListAsync();

        return Ok(new AccountExportResponse(
            profile.ToResponse(),
            saved.Select(item => item.ToResponse()).ToList(),
            DateTime.UtcNow));
    }

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe(CancellationToken ct)
    {
        var userId = User.GetRequiredUserId();
        // Remove the login first: if that fails nothing else is touched, so the user can retry.
        if (!await _authDeleter.DeleteAsync(userId, ct))
        {
            return Problem(
                detail: "Account could not be deleted. Nothing was removed.",
                statusCode: StatusCodes.Status502BadGateway);
        }

        try
        {
            // A login can exist without a profile row; remove whatever is there.
            var saved = await _db.SavedOpportunities.Where(item => item.UserId == userId).ToListAsync(ct);
            _db.SavedOpportunities.RemoveRange(saved);
            var profile = await _db.UserProfiles.FirstOrDefaultAsync(user => user.Id == userId, ct);
            if (profile is not null) _db.UserProfiles.Remove(profile);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Login {UserId} was deleted but removing its database rows failed", userId);
            throw;
        }
        return NoContent();
    }
}
