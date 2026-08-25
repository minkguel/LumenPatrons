using System.ComponentModel.DataAnnotations;

namespace LumenPatrons.Api.Contracts;

public record FundingOpportunityResponse(
    Guid Id,
    string Title,
    string PatronName,
    IReadOnlyCollection<string> Category,
    decimal? MinimumAmount,
    DateTime? Deadline,
    string ExternalUrl,
    bool IsPremiumOnly,
    DateTime CreatedAt);

public record SavedOpportunityResponse(
    Guid Id,
    string Status,
    string? AttachedDocumentUrl,
    DateTime SavedAt,
    FundingOpportunityResponse Opportunity);

public sealed record CreateSavedOpportunityRequest(
    Guid FundingOpportunityId,
    [property: MaxLength(50)] string Status = "Saved");

public sealed record UpdateSavedOpportunityRequest(
    [property: Required, MaxLength(50)] string Status,
    string? AttachedDocumentUrl);

public record UserProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string UserType,
    string SubscriptionTier,
    DateTime CreatedAt);

public sealed record UpdateUserProfileRequest(
    [property: Required, MaxLength(100)] string FullName,
    [property: Required, MaxLength(50)] string UserType);

public static class ContractMappings
{
    public static FundingOpportunityResponse ToResponse(this Models.FundingOpportunity item) =>
        new(item.Id, item.Title, item.PatronName, item.Category, item.MinimumAmount,
            item.Deadline, item.ExternalUrl, item.IsPremiumOnly, item.CreatedAt);

    public static UserProfileResponse ToResponse(this Models.UserProfile item) =>
        new(item.Id, item.Email, item.FullName, item.UserType, item.SubscriptionTier, item.CreatedAt);

    public static SavedOpportunityResponse ToResponse(this Models.SavedOpportunity item) =>
        new(item.Id, item.Status, item.AttachedDocumentUrl, item.SavedAt, item.Opportunity.ToResponse());
}
