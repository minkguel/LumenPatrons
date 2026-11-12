using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LumenPatrons.Api.Contracts;

public record FundingOpportunityResponse(
    Guid Id,
    string Title,
    string PatronName,
    IReadOnlyCollection<string> Category,
    string Description,
    string? Eligibility,
    decimal? EstimatedAmount,
    string? Currency,
    DateTime? Deadline,
    string Status,
    string ExternalUrl,
    DateTime CreatedAt);

public record SavedOpportunityResponse(
    Guid Id,
    string Status,
    string? AttachedDocumentUrl,
    DateTime SavedAt,
    FundingOpportunityResponse Opportunity);

public sealed record CreateSavedOpportunityRequest(
    Guid FundingOpportunityId,
    [param: MaxLength(50)] string Status = "Saved");

public sealed record UpdateSavedOpportunityRequest(
    [param: Required, MaxLength(50)] string Status,
    string? AttachedDocumentUrl);

public record UserProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string UserType,
    DateTime CreatedAt);

public sealed record UpdateUserProfileRequest(
    [param: Required, MaxLength(100)] string FullName,
    [param: Required, MaxLength(50)] string UserType);

public sealed record FundingOpportunityRequest(
    [param: Required, MaxLength(200)] string Title,
    [param: Required, MaxLength(150)] string PatronName,
    List<string>? Category,
    string? Description,
    string? Eligibility,
    decimal? EstimatedAmount,
    [param: MaxLength(3)] string? Currency,
    DateTime? Deadline,
    [param: MaxLength(20)] string? Status,
    string? ExternalUrl);

// One scraper row. Single fields are raw JSON values so a wrongly-shaped field
// (e.g. a number where text is expected) becomes blank instead of failing the upload.
public sealed record ImportOpportunityItem
{
    [JsonPropertyName("title")] public JsonElement? Title { get; init; }
    [JsonPropertyName("patron_name")] public JsonElement? PatronName { get; init; }
    [JsonPropertyName("category")] public JsonElement? Category { get; init; }
    [JsonPropertyName("description")] public JsonElement? Description { get; init; }
    [JsonPropertyName("eligibility")] public JsonElement? Eligibility { get; init; }
    [JsonPropertyName("estimated_amount")] public JsonElement? EstimatedAmount { get; init; }
    [JsonPropertyName("minimum_amount")] public JsonElement? MinimumAmount { get; init; }
    [JsonPropertyName("currency")] public JsonElement? Currency { get; init; }
    [JsonPropertyName("deadline")] public JsonElement? Deadline { get; init; }
    [JsonPropertyName("external_url")] public JsonElement? ExternalUrl { get; init; }
}

public sealed record ImportError(int Index, string Reason);

public sealed record ImportResult(int Created, int Updated, int Skipped, IReadOnlyList<ImportError> Errors);

public static class ContractMappings
{
    public static FundingOpportunityResponse ToResponse(this Models.FundingOpportunity item) =>
        new(item.Id, item.Title, item.PatronName, item.Category, item.Description, item.Eligibility,
            item.EstimatedAmount, item.Currency, item.Deadline, item.Status, item.ExternalUrl, item.CreatedAt);

    public static UserProfileResponse ToResponse(this Models.UserProfile item) =>
        new(item.Id, item.Email, item.FullName, item.UserType, item.CreatedAt);

    public static SavedOpportunityResponse ToResponse(this Models.SavedOpportunity item) =>
        new(item.Id, item.Status, item.AttachedDocumentUrl, item.SavedAt, item.Opportunity.ToResponse());
}
