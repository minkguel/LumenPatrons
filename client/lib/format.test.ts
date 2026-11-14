import { describe, expect, it } from "vitest";
import { deadlineLabel, formatAmount, formatDate } from "./format";

describe("formatAmount", () => {
  it("shows a dash when there is no amount", () => {
    expect(formatAmount(null, "DKK")).toBe("—");
    expect(formatAmount(undefined, "DKK")).toBe("—");
  });

  it("formats zero", () => {
    expect(formatAmount(0, "EUR")).toContain("0");
  });

  it("uses the opportunity's own currency", () => {
    expect(formatAmount(500000, "DKK")).toMatch(/DKK|kr/);
    expect(formatAmount(500000, "DKK")).toContain("500,000");
  });

  it("falls back to a plain number without a currency", () => {
    expect(formatAmount(1200, null)).toBe("1,200");
  });

  it("falls back to number plus raw text for an invalid ISO code", () => {
    expect(formatAmount(1200, "kr")).toBe("1,200 kr");
  });
});

describe("deadlineLabel", () => {
  const now = new Date("2026-11-12T12:00:00Z");

  it("handles missing or invalid deadlines", () => {
    expect(deadlineLabel(undefined, "Open", now)).toBe("No deadline");
    expect(deadlineLabel("not a date", "Open", now)).toBe("No deadline");
  });

  it("reports closed opportunities", () => {
    expect(deadlineLabel("2026-11-01T00:00:00Z", "Open", now)).toBe("Closed");
    expect(deadlineLabel("2026-12-01T00:00:00Z", "Closed", now)).toBe("Closed");
  });

  it("reports a closed opportunity without a deadline as closed", () => {
    expect(deadlineLabel(undefined, "Closed", now)).toBe("Closed");
    expect(deadlineLabel(null, "closed", now)).toBe("Closed");
  });

  it("counts down to the deadline", () => {
    expect(deadlineLabel("2026-11-12T20:00:00Z", "Open", now)).toBe("Closes today");
    expect(deadlineLabel("2026-11-13T12:00:00Z", "Open", now)).toBe("Closes in 1 day");
    expect(deadlineLabel("2026-11-22T12:00:00Z", "Open", now)).toBe("Closes in 10 days");
  });
});

describe("formatDate", () => {
  it("uses day, short month, year", () => {
    expect(formatDate("2026-11-12T12:00:00Z")).toBe("12 Nov 2026");
  });
});
