import { authorizedFetch } from "@/lib/api";

export type ProfileSeed = {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
};

const PROFILE_PATH = "/api/v1/userprofiles/me";
const MAX_FULL_NAME = 100;
const MAX_USER_TYPE = 50;

const inFlight = new Map<string, Promise<void>>();
const confirmed = new Set<string>();

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function profileRequestBody(user: ProfileSeed): { fullName: string; userType: string } {
  const fullName = text(user.user_metadata?.full_name) || user.email?.split("@")[0]?.trim() || "User";
  const userType = text(user.user_metadata?.user_type) || "Founder";
  return {
    fullName: fullName.slice(0, MAX_FULL_NAME),
    userType: userType.slice(0, MAX_USER_TYPE),
  };
}

async function provision(user: ProfileSeed): Promise<void> {
  try {
    const existing = await authorizedFetch(PROFILE_PATH);
    if (existing.ok) {
      confirmed.add(user.id);
      return;
    }
    if (existing.status !== 404) return;

    const created = await authorizedFetch(PROFILE_PATH, {
      method: "PUT",
      body: JSON.stringify(profileRequestBody(user)),
    });
    if (created.ok) confirmed.add(user.id);
  } catch (error) {
    console.error("Failed to provision user profile", error);
  }
}

export function ensureProfile(user: ProfileSeed): Promise<void> {
  if (confirmed.has(user.id)) return Promise.resolve();
  const pending = inFlight.get(user.id);
  if (pending) return pending;

  const run = provision(user).finally(() => {
    inFlight.delete(user.id);
  });
  inFlight.set(user.id, run);
  return run;
}

export function resetProfileStateForTests() {
  inFlight.clear();
  confirmed.clear();
}
