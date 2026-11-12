import { describe, expect, it } from "vitest";
import { discoverQuery } from "@/lib/discover";

describe("discoverQuery", () => {
  it("returns an empty string with no filters", () => {
    expect(discoverQuery({})).toBe("");
  });

  it("trims the search text", () => {
    expect(discoverQuery({ q: "  bio " })).toBe("?q=bio");
  });

  it("combines search and category", () => {
    expect(discoverQuery({ q: "a b", category: "Health" })).toBe("?q=a+b&category=Health");
  });

  it("omits a blank search", () => {
    expect(discoverQuery({ q: "   " })).toBe("");
  });

  it("cuts the search text to 100 characters", () => {
    const params = new URLSearchParams(discoverQuery({ q: "x".repeat(150) }));
    expect(params.get("q")).toHaveLength(100);
  });
});
