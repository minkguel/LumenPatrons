export const MAX_IMPORT_ITEMS = 500;

export function parseImportFile(text: string): { items: unknown[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "This file is not valid JSON." };
  }
  if (!Array.isArray(parsed)) return { error: "The file must contain a list of opportunities." };
  if (parsed.length === 0) return { error: "The file is empty." };
  if (parsed.length > MAX_IMPORT_ITEMS) return { error: `Maximum ${MAX_IMPORT_ITEMS} opportunities per file.` };
  return { items: parsed };
}
