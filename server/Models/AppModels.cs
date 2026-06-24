using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LumenPatrons.Api.Models;

public class UserProfile
{
    [Key] public Guid Id { get; set; }
    [Required, MaxLength(100)] public string Email { get; set; } = string.Empty;
    [MaxLength(100)] public string FullName { get; set; } = string.Empty;
    public string UserType { get; set; } = string.Empty;
    public string? StripeCustomerId { get; set; }
    public string SubscriptionTier { get; set; } = "Free";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SavedOpportunity> SavedOpportunities { get; set; } = new List<SavedOpportunity>();
}

public class FundingOpportunity
{
    [Key] public Guid Id { get; set; }
    [Required, MaxLength(200)] public string Title { get; set; } = string.Empty;
    [Required, MaxLength(150)] public string PatronName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    [Column(TypeName = "decimal(18,2)")] public decimal? MinimumAmount { get; set; }
    public DateTime Deadline { get; set; }
    public string ExternalUrl { get; set; } = string.Empty;
    public bool IsPremiumOnly { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<SavedOpportunity> SavedByUsers { get; set; } = new List<SavedOpportunity>();
}

public class SavedOpportunity
{
    [Key] public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public UserProfile User { get; set; } = null!;
    public Guid FundingOpportunityId { get; set; }
    public FundingOpportunity Opportunity { get; set; } = null!;
    [Required, MaxLength(50)] public string Status { get; set; } = "Saved";
    public string? AttachedDocumentUrl { get; set; }
    public DateTime SavedAt { get; set; } = DateTime.UtcNow;
}
