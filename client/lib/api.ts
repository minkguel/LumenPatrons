export type SystemStatus = {
  service?: string;
  database?: string;
  timestamp?: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5083";

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
