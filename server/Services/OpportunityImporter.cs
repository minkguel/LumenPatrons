using System.Globalization;
using System.Text.Json;
using LumenPatrons.Api.Contracts;
using LumenPatrons.Api.Data;
using LumenPatrons.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LumenPatrons.Api.Services;

public class OpportunityImporter
{
    private readonly AppDbContext _db;

    public OpportunityImporter(AppDbContext db) => _db = db;

    public async Task<ImportResult> ImportAsync(IReadOnlyList<ImportOpportunityItem?> items, CancellationToken ct)
    {
        var errors = new List<ImportError>();
        // Later items win when the same link appears twice in one file.
        var byKey = new Dictionary<string, Normalised>();

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            if (item is null)
            {
                errors.Add(new ImportError(i, "Missing title"));
                continue;
            }

            var title = Text(item.Title);
            if (title.Length == 0)
            {
                errors.Add(new ImportError(i, "Missing title"));
                continue;
            }

            var url = NormaliseUrl(Text(item.ExternalUrl));
            if (url is null)
            {
                errors.Add(new ImportError(i, "Invalid link"));
                continue;
            }

            var patron = Text(item.PatronName);
            byKey[url.ToLowerInvariant()] = new Normalised(
                url,
                Cut(title, 200),
                patron.Length == 0 ? "Unknown" : Cut(patron, 150),
                Categories(item.Category),
                Text(item.Description),
                NullIfBlank(Text(item.Eligibility)),
                Amount(item.EstimatedAmount) ?? Amount(item.MinimumAmount),
                Currency(item.Currency),
                Deadline(item.Deadline));
        }

        var created = 0;
        var updated = 0;

        if (byKey.Count > 0)
        {
            // Stored links may or may not end in "/", so look up both spellings.
            var candidates = byKey.Keys.SelectMany(k => new[] { k, k + "/" }).ToList();
            var existing = await _db.FundingOpportunities
                .Where(f => candidates.Contains(f.ExternalUrl.ToLower()))
                .ToListAsync(ct);
            var existingByKey = new Dictionary<string, FundingOpportunity>();
            foreach (var row in existing)
                existingByKey[row.ExternalUrl.Trim().TrimEnd('/').ToLowerInvariant()] = row;

            foreach (var (key, data) in byKey)
            {
                if (existingByKey.TryGetValue(key, out var row))
                {
                    Apply(row, data);
                    updated++;
                }
                else
                {
                    var added = new FundingOpportunity
                    {
                        Id = Guid.NewGuid(),
                        Status = "Open",
                        CreatedAt = DateTime.UtcNow
                    };
                    Apply(added, data);
                    _db.FundingOpportunities.Add(added);
                    created++;
                }
            }

            await _db.SaveChangesAsync(ct);
        }

        return new ImportResult(created, updated, errors.Count, errors);
    }

    private static void Apply(FundingOpportunity row, Normalised data)
    {
        row.Title = data.Title;
        row.PatronName = data.PatronName;
        row.Category = data.Category;
        row.Description = data.Description;
        row.Eligibility = data.Eligibility;
        row.EstimatedAmount = data.EstimatedAmount;
        row.Currency = data.Currency;
        row.Deadline = data.Deadline;
        row.ExternalUrl = data.Url;
    }

    private static string Text(JsonElement? value) =>
        value is { ValueKind: JsonValueKind.String } v ? v.GetString()?.Trim() ?? "" : "";

    private static string? NullIfBlank(string value) => value.Length == 0 ? null : value;

    private static string Cut(string value, int max) => value.Length <= max ? value : value[..max];

    private static string? NormaliseUrl(string raw)
    {
        var url = raw.Trim().TrimEnd('/');
        return Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
            ? url
            : null;
    }

    private static List<string> Categories(JsonElement? value)
    {
        if (value is not { } v) return new List<string>();
        if (v.ValueKind == JsonValueKind.String)
        {
            var single = v.GetString()?.Trim() ?? "";
            return single.Length == 0 ? new List<string>() : new List<string> { single };
        }
        if (v.ValueKind == JsonValueKind.Array)
        {
            return v.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.String)
                .Select(e => e.GetString()?.Trim() ?? "")
                .Where(s => s.Length > 0)
                .ToList();
        }
        return new List<string>();
    }

    private static decimal? Amount(JsonElement? value)
    {
        decimal parsed;
        switch (value)
        {
            case { ValueKind: JsonValueKind.Number } n when n.TryGetDecimal(out parsed):
                break;
            case { ValueKind: JsonValueKind.String } s
                when decimal.TryParse(s.GetString()?.Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out parsed):
                break;
            default:
                return null;
        }
        // Column is decimal(18,2).
        return Math.Abs(parsed) >= 10_000_000_000_000_000m ? null : parsed;
    }

    private static string? Currency(JsonElement? value)
    {
        var text = Text(value);
        return text.Length == 3 && text.All(char.IsAsciiLetter) ? text.ToUpperInvariant() : null;
    }

    private static DateTime? Deadline(JsonElement? value)
    {
        var text = Text(value);
        if (text.Length == 0) return null;
        return DateTime.TryParse(text, CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var parsed)
            ? parsed
            : null;
    }

    private sealed record Normalised(
        string Url, string Title, string PatronName, List<string> Category, string Description,
        string? Eligibility, decimal? EstimatedAmount, string? Currency, DateTime? Deadline);
}
