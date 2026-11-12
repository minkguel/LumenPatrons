"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { importOpportunities, type ImportResult } from "@/lib/api";
import { parseImportFile } from "@/lib/import";

type ImportFormProps = {
  onImported: () => void;
};

export function ImportForm({ onImported }: ImportFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a JSON file first.");
      return;
    }
    setError(null);
    setResult(null);

    const parsed = parseImportFile(await file.text());
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }

    setIsUploading(true);
    try {
      setResult(await importOpportunities(parsed.items));
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="import-file" className="block text-sm font-medium text-foreground/80">
            Scraper JSON file
          </label>
          <input
            id="import-file"
            type="file"
            accept=".json,application/json"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-foreground/80"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={isUploading}>
          {isUploading ? "Importing..." : "Import"}
        </Button>

        {error && (
          <p role="alert" className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {result && (
          <div className="space-y-2">
            <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2">
              {result.created} added, {result.updated} updated, {result.skipped} skipped
            </p>
            {result.errors.length > 0 && (
              <ul className="text-sm text-foreground/55 space-y-1">
                {result.errors.map((e) => (
                  <li key={e.index}>
                    Row {e.index + 1}: {e.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </Card>
  );
}
