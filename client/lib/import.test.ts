import { describe, expect, it } from "vitest";
import { parseImportFile } from "@/lib/import";

describe("parseImportFile", () => {
  it("returns the items for a valid array", () => {
    const items = [{ title: "A" }, { title: "B" }];
    expect(parseImportFile(JSON.stringify(items))).toEqual({ items });
  });

  it("rejects JSON that is not a list", () => {
    expect(parseImportFile("{}")).toEqual({ error: "The file must contain a list of opportunities." });
  });

  it("rejects text that is not JSON", () => {
    expect(parseImportFile("not json")).toEqual({ error: "This file is not valid JSON." });
  });

  it("rejects an empty list", () => {
    expect(parseImportFile("[]")).toEqual({ error: "The file is empty." });
  });

  it("rejects more than 500 items", () => {
    const items = Array.from({ length: 501 }, (_, i) => ({ i }));
    expect(parseImportFile(JSON.stringify(items))).toEqual({ error: "Maximum 500 opportunities per file." });
  });

  it("accepts exactly 500 items", () => {
    const items = Array.from({ length: 500 }, (_, i) => ({ i }));
    expect(parseImportFile(JSON.stringify(items))).toEqual({ items });
  });
});
