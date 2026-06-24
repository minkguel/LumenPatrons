using LumenPatrons.Api.Models; // <-- THIS IS THE MISSING LINK
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<FundingOpportunity> FundingOpportunities { get; set; }
    public DbSet<SavedOpportunity> SavedOpportunities { get; set; }
}
