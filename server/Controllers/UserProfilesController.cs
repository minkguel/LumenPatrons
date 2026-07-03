using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class UserProfilesController : ControllerBase
{
    private readonly AppDbContext _db;

    public UserProfilesController(AppDbContext db)
    {
        _db = db;
    }

    // GET: api/v1/userprofiles
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserProfile>>> GetAll()
    {
        return await _db.UserProfiles.ToListAsync();
    }

    // GET: api/v1/userprofiles/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<UserProfile>> GetById(Guid id)
    {
        var user = await _db.UserProfiles.FindAsync(id);
        if (user == null)
            return NotFound();

        return user;
    }

    // POST: api/v1/userprofiles
    [HttpPost]
    public async Task<ActionResult<UserProfile>> Create(UserProfile user)
    {
        user.Id = Guid.NewGuid();
        user.CreatedAt = DateTime.UtcNow;

        _db.UserProfiles.Add(user);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    // PUT: api/v1/userprofiles/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UserProfile user)
    {
        if (id != user.Id)
            return BadRequest();

        _db.Entry(user).State = EntityState.Modified;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _db.UserProfiles.AnyAsync(u => u.Id == id))
                return NotFound();
            throw;
        }

        return NoContent();
    }

    // DELETE: api/v1/userprofiles/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _db.UserProfiles.FindAsync(id);
        if (user == null)
            return NotFound();

        _db.UserProfiles.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
