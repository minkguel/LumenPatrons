export type SystemStatus = {
  service?: string;
  database?: string;
  timestamp?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5083";

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
  description?: string;
  category?: string;
  minimumAmount?: number | null;
  deadline?: string; // ISO string from backend
  externalUrl?: string;
  isPremiumOnly?: boolean;
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
