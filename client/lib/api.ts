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
  minimumAmount?: number | null;
  deadline?: string; // ISO string from backend
  externalUrl?: string;
  createdAt?: string;
};

export async function getFundingOpportunities(): Promise<FundingOpportunity[]> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/fundingopportunities`);
    if (!response.ok) return [];
    const data = await response.json();
    return data as FundingOpportunity[];
  } catch (e) {
    console.error("Failed to fetch funding opportunities", e);
    return [];
  }
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

export type SavedOpportunity = {
  id: string;
  status: "Saved" | "Applied" | "Submitted";
  attachedDocumentUrl?: string | null;
  savedAt: string;
  opportunity: FundingOpportunity;
};

export async function getSavedOpportunities(): Promise<SavedOpportunity[]> {
  const response = await authorizedFetch("/api/v1/savedopportunities");
  if (!response.ok) throw new Error(`Failed to load saved opportunities (${response.status}).`);
  return response.json();
}

export async function deleteSavedOpportunity(id: string): Promise<void> {
  const response = await authorizedFetch(`/api/v1/savedopportunities/${id}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to remove saved opportunity (${response.status}).`);
  }
}
