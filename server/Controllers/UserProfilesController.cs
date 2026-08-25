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
[Route("api/v1/userprofiles")]
public class UserProfilesController : ControllerBase
{
    private readonly AppDbContext _db;
    public UserProfilesController(AppDbContext db) => _db = db;

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

    [HttpDelete("me")]
    public async Task<IActionResult> DeleteMe()
    {
        var userId = User.GetRequiredUserId();
        var profile = await _db.UserProfiles.FindAsync(userId);
        if (profile is null) return NotFound();
        _db.UserProfiles.Remove(profile);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
