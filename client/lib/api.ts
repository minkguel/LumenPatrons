export type SystemStatus = {
  service?: string;
  database?: string;
  timestamp?: string;
};

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/status`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { database: "Backend Offline", service: "Disconnected" };
    }
    return response.json();
  } catch {
    return { database: "Backend Offline", service: "Disconnected" };
  }
}

// Basic fetch for funding opportunities from the API
export type FundingOpportunity = {
  id: string;
  title: string;
  patronName: string;
  category?: string[];
  description?: string;
  eligibility?: string | null;
  estimatedAmount?: number | null;
  currency?: string | null;
  deadline?: string; // ISO string from backend
  status?: string;
  externalUrl?: string;
  createdAt?: string;
};

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { index: number; reason: string }[];
};

export type FundingOpportunityFilters = DiscoverFilters & {
  /** Include closed/expired opportunities (the list hides them by default). */
  includeClosed?: boolean;
};

export async function getFundingOpportunities(
  filters: FundingOpportunityFilters = {},
): Promise<FundingOpportunity[]> {
  const params = new URLSearchParams(discoverQuery(filters));
  if (filters.includeClosed) params.set("includeClosed", "true");
  const query = params.toString();
  const response = await fetch(
    `${API_BASE}/api/v1/fundingopportunities${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error(`Failed to load funding opportunities (${response.status}).`);
  return (await response.json()) as FundingOpportunity[];
}

/** Returns the opportunity, or null when it does not exist (404). */
export async function getFundingOpportunity(id: string): Promise<FundingOpportunity | null> {
  const response = await fetch(
    `${API_BASE}/api/v1/fundingopportunities/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to load funding opportunity (${response.status}).`);
  return (await response.json()) as FundingOpportunity;
}

export async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/api/v1/fundingopportunities/categories`);
  if (!response.ok) throw new Error(`Failed to load categories (${response.status}).`);
  return (await response.json()) as string[];
}

export type AuthorizedFetchOptions = {
  /** Return a 401 as-is instead of signing out and redirecting to /auth. */
  skipAuthRecovery?: boolean;
};

export async function authorizedFetch(
  path: string,
  init: RequestInit = {},
  options: AuthorizedFetchOptions = {},
) {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("You must be signed in to perform this action.");

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });

  if (response.status === 401 && !options.skipAuthRecovery && typeof window !== "undefined") {
    try {
      await signOut("local");
    } catch (error) {
      console.error("Failed to clear expired session", error);
    }
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/auth?next=${next}&reason=expired`);
  }

  return response;
}
import { getAccessToken, signOut } from "@/lib/auth";
import { discoverQuery, type DiscoverFilters } from "@/lib/discover";

export type SavedStatus = "Saved" | "Submitted";

export type SavedOpportunity = {
  id: string;
  status: SavedStatus;
  attachedDocumentUrl?: string | null;
  savedAt: string;
  opportunity: FundingOpportunity;
};

export async function getSavedOpportunities(): Promise<SavedOpportunity[]> {
  const response = await authorizedFetch("/api/v1/savedopportunities");
  if (!response.ok) throw new Error(`Failed to load saved opportunities (${response.status}).`);
  return response.json();
}

// Error bodies are ProblemDetails JSON (use `detail`) or plain text.
async function readErrorDetail(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const body = JSON.parse(text);
    if (body && typeof body.detail === "string") return body.detail;
  } catch {
    // not JSON: fall through to the raw text
  }
  return text;
}

export async function saveOpportunity(fundingOpportunityId: string): Promise<void> {
  const response = await authorizedFetch("/api/v1/savedopportunities", {
    method: "POST",
    body: JSON.stringify({ fundingOpportunityId }),
  });
  if (response.ok) return;

  // The server uses 409 for both "already saved" and "no profile yet".
  if (response.status === 409) {
    const message = await readErrorDetail(response);
    if (message.includes("already saved")) return;
    throw new Error("Create your user profile before saving opportunities.");
  }
  throw new Error("Could not save this opportunity. Please try again.");
}

export async function updateSavedStatus(id: string, status: SavedStatus): Promise<void> {
  const response = await authorizedFetch(`/api/v1/savedopportunities/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update saved status (${response.status}).`);
}

export async function deleteSavedOpportunity(id: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/savedopportunities/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to remove saved opportunity (${response.status}).`);
  }
}

export async function importOpportunities(items: unknown[]): Promise<ImportResult> {
  const response = await authorizedFetch("/api/v1/fundingopportunities/import", {
    method: "POST",
    body: JSON.stringify(items),
  });
  if (!response.ok) {
    let detail: string | undefined;
    try {
      const problem = await response.json();
      if (typeof problem?.detail === "string" && problem.detail) detail = problem.detail;
    } catch {
      // body was not JSON; fall back to the generic message
    }
    throw new Error(detail ?? "Import failed. Please try again.");
  }
  return response.json();
}

export async function deleteOpportunity(id: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/fundingopportunities/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete opportunity (${response.status}).`);
  }
}
