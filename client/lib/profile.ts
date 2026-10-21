import { authorizedFetch } from "@/lib/api";

export type ProfileSeed = {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
};

const PROFILE_PATH = "/api/v1/userprofiles/me";
// A 401 here must never trigger the global sign-out/redirect: it is just another failure to log.
const NO_AUTH_RECOVERY = { skipAuthRecovery: true };
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
    const existing = await authorizedFetch(PROFILE_PATH, {}, NO_AUTH_RECOVERY);
    if (existing.ok) {
      confirmed.add(user.id);
      return;
    }
    if (existing.status !== 404) {
      console.error("Profile lookup failed", existing.status);
      return;
    }

    const created = await authorizedFetch(
      PROFILE_PATH,
      { method: "PUT", body: JSON.stringify(profileRequestBody(user)) },
      NO_AUTH_RECOVERY,
    );
    if (created.ok) confirmed.add(user.id);
    else console.error("Profile creation failed", created.status);
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
