import { defineConfig, devices } from "@playwright/test";
import {
  API_URL,
  APP_URL,
  DB_CONNECTION,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./e2e/env";

// Browser tests run against the local Supabase CLI stack (`npx supabase start`), never hosted Supabase.
// Before `npm run e2e`, export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from `npx supabase status -o env`
// and apply the EF migrations to the local database (see .github/workflows/security-tests.yml, e2e job).
if (!SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set; the app cannot reach the local Supabase stack.",
  );
}

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: 0,
  timeout: 60_000,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run dev",
      url: APP_URL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SUPABASE_PUBLISHABLE_KEY,
        NEXT_PUBLIC_API_URL: API_URL,
      },
    },
    {
      command: "dotnet run --project ../server --launch-profile http",
      url: `${API_URL}/api/v1/status`,
      reuseExistingServer: !isCI,
      timeout: 180_000,
      env: {
        Supabase__Url: SUPABASE_URL,
        ConnectionStrings__SupabaseConnection: DB_CONNECTION,
      },
    },
  ],
});
