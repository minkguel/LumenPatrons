import { createClient } from "@supabase/supabase-js";
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "./env";

/**
 * Gives a user the admin role. Uses the service-role key, so it must only ever point at the
 * LOCAL Supabase CLI stack. The user has to sign in again for the new role to reach their token.
 */
export async function makeAdmin(userId: string): Promise<void> {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (use the local stack's SERVICE_ROLE_KEY).");
  }
  const { hostname } = new URL(SUPABASE_URL);
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error(`Refusing to use a service-role key against ${hostname}; local stack only.`);
  }
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "admin" },
  });
  if (error) throw new Error(`Could not make user admin: ${error.message}`);
}
