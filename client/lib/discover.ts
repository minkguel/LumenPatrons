export type DiscoverFilters = { q?: string; category?: string };

const MAX_QUERY_LENGTH = 100;

/** Builds the Discover query string ("?q=…&category=…"), omitting blank values. */
export function discoverQuery(filters: DiscoverFilters): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim().slice(0, MAX_QUERY_LENGTH).trim();
  if (q) params.set("q", q);
  const category = filters.category?.trim();
  if (category) params.set("category", category);
  const query = params.toString();
  return query ? `?${query}` : "";
}
