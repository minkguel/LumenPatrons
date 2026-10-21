// Endpoints of the local Supabase CLI stack and the app under test.
// Defaults match `supabase start` and `supabase/config.toml`; CI or a developer can override each one.
// The publishable key has no stable default: export it from `npx supabase status -o env`.

export const APP_URL = "http://localhost:3000";

/** Assertion timeout. Generous because a route's first visit can include compile/cold-start time. */
export const EXPECT_TIMEOUT_MS = 15_000;

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5083";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";

export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:54324";

export const DB_CONNECTION =
  process.env.E2E_DB_CONNECTION ??
  "Host=127.0.0.1;Port=54322;Database=postgres;Username=postgres;Password=postgres";
