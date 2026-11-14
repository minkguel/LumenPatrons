# LumenPatrons

A SaaS product that helps founders and researchers find, track and apply for non‑dilutive funding (grants, stipends, institutional backing) with less noise.

This README covers the project goal, tech stack, repo layout, what's built, the API endpoints, how to run the project, how to test it, and its current status. See `stack.md` for the short stack summary.

---

## Project goal
Make it easy to discover, save and apply for non‑dilutive funding: a searchable feed of opportunities, a personal saved list with status tracking, and admin tooling to import scraped data.

---

## Tech stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind CSS 4
- Auth: Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- Backend: C# / ASP.NET Core Web API on .NET 10, Entity Framework Core 10 (Npgsql)
- Database: PostgreSQL on Supabase
- Tests: xUnit v3 (API), Vitest (client unit tests), Playwright (browser E2E)
- CI: GitHub Actions (`.github/workflows/security-tests.yml`)
- Containers: Docker Compose (local development)

---

## Repository layout (monorepo)
- `client/`: Next.js frontend
- `server/`: ASP.NET Core API
- `server.tests/`: API tests (xUnit)
- `supabase/`: local Supabase CLI config (`config.toml`) and auth email templates
- `scraper/`: Python scrapers, run locally (not part of the deployed product)
- `docs/`: design specs and implementation plans
- `.github/workflows/`: CI
- `docker-compose.yml`, `.env.example`, `stack.md`, `PRODUCTION_BACKLOG.md`

---

## What's implemented

### Frontend (client)
- Root layout: `client/app/layout.tsx` loads the fonts (Bricolage Grotesque, Atkinson Hyperlegible) and the theme script, and wraps the app in `AuthProvider`.
- Route protection: `client/proxy.ts` refreshes the Supabase session on each request and redirects based on whether the user is signed in (rules in `client/lib/auth/redirects.ts`).
- Redirect: `/applications` → `/saved-patrons` (`client/next.config.ts`).
- App pages (`client/app/(app)/`):
  - `page.tsx`: Discover. Search and category filter over funding opportunities.
  - `opportunities/[id]/page.tsx`: opportunity detail.
  - `saved-patrons/page.tsx`: saved opportunities, with a Saved / Submitted status filter.
  - `settings/page.tsx`: profile (name, user type, saved to the API), theme picker (light / dark / system, stored in `localStorage`), data export and account deletion.
  - `admin/page.tsx`: admin only. Import a scraper JSON file and delete opportunities.
- Auth pages (`client/app/(auth)/auth/`): sign in / sign up, check email, forgot password, reset password, link error, and the `confirm` route handler for email links.
- Components (`client/components/`): `layout/` (AppShell, Sidebar, Topbar, nav, StatusWidget, ThemeScript), `discover/`, `saved-patrons/`, `settings/`, `admin/`, `auth/`, and `ui/` primitives.
- Libraries (`client/lib/`):
  - `api.ts`: API client (status, opportunities, categories, saved items, import) plus `authorizedFetch`, which attaches the Supabase access token.
  - `auth.ts`, `auth/*`: Supabase auth helpers, validation, messages and redirects.
  - `profile.ts`: profile get/update, export, and account deletion.
  - `supabase/browser.ts`, `supabase/server.ts`: Supabase clients.
  - `discover.ts`, `import.ts`, `format.ts`, `theme.ts`, `options.ts`: helpers.
- Unit tests sit next to the code as `*.test.ts` (Vitest). E2E tests are in `client/e2e/` (Playwright).

### Backend (server)
- Startup (`server/Program.cs`):
  - `AppDbContext` on PostgreSQL (`ConnectionStrings:SupabaseConnection`).
  - JWT bearer auth against Supabase (`Supabase:Url`). Validates issuer, audience `authenticated` and lifetime, using JWKS.
  - `AdminOnly` policy: requires `app_metadata.role = "admin"` in the token.
  - CORS policy `AllowNextJs` reads `Cors:AllowedOrigins` (defaults to `http://localhost:3000`).
  - ProblemDetails error responses. `UnauthorizedAccessException` returns 401.
  - `GET /api/v1/status` (anonymous) pings the database.
- Controllers (`server/Controllers/`): `FundingOpportunitiesController`, `SavedOpportunitiesController`, `UserProfilesController`.
- Contracts (`server/Contracts/ApiContracts.cs`): request/response DTOs, import item shape, and the `AbsoluteHttpUrl` validator.
- Services (`server/Services/`):
  - `OpportunityImporter`: normalises scraper rows and upserts them by external URL (creates, updates or skips each row, and reports errors per row).
  - `SupabaseAuthAdmin`: deletes the user's Supabase login when they delete their account (uses the service role key).
- Auth helpers (`server/Auth/`): `ClaimsPrincipalExtensions` (user ID and email from the token), `SupabaseUrl`.
- Models (`server/Models/AppModels.cs`): `UserProfile`, `FundingOpportunity`, `SavedOpportunity`.
- DbContext (`server/Data/AppDbContext.cs`): unique email on profiles, and unique (user, opportunity) on saved items. `AppDbContextFactory` is used by design-time `dotnet ef`.
- Migrations (`server/Migrations/`): includes `SecurityFoundation`, which enables Supabase row-level security (RLS) policies on all three tables.
- `server/LumenPatrons.Api.http`: sample requests.

---

## API endpoints
All routes are under `/api/v1`. Protected routes need `Authorization: Bearer <Supabase access token>`.

- `GET /status`: service and database check (anonymous)
- Funding opportunities (`/fundingopportunities`)
  - `GET /`: public. Query: `q` (search title/patron/description), `category`, `includeClosed` (default `false`, which hides closed or expired items). Returns at most 1000 rows.
  - `GET /categories`: public. Distinct category list.
  - `GET /{id}`: public.
  - `POST /`, `PUT /{id}`, `DELETE /{id}`: admin only.
  - `POST /import`: admin only. JSON array of scraper rows (max 500). Returns `{ created, updated, skipped, errors }`.
- Saved opportunities (`/savedopportunities`): signed in, owner only
  - `GET /`: the current user's items.
  - `GET /{id}`, `PUT /{id}` (status), `DELETE /{id}`.
  - `POST /`: save an opportunity. The owner always comes from the JWT, never the request body. Status is `Saved` or `Submitted`.
- User profiles (`/userprofiles`): signed in, current user only
  - `GET /me`
  - `PUT /me`: create or update the profile (`fullName`, `userType`). Email comes from the token.
  - `GET /me/export`: JSON export of the profile and saved items.
  - `DELETE /me`: deletes the Supabase login first, then the profile and saved items. Returns 502 and removes nothing if the login can't be deleted.

---

## Quick start: local development

### Environment files
Copy `.env.example` and fill in the values:
- `client/.env.local`: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `server/.env`: `ConnectionStrings__SupabaseConnection`, `Supabase__Url`, `Supabase__ServiceRoleKey`, and optionally `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`, …

Docker Compose needs both files. `NEXT_PUBLIC_API_URL` has no default, so always set it (e.g. `http://localhost:5083`).

Variables:
- Frontend
  - `NEXT_PUBLIC_API_URL`: API base URL, e.g. `http://localhost:5083`
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser-safe publishable key. Never use a secret or service-role key here.
- Backend
  - `ConnectionStrings__SupabaseConnection`: `Host=...;Port=5432;Database=...;Username=...;Password=...;`
  - `Supabase__Url`: required. Used for JWT issuer/JWKS validation (the API won't start without it).
  - `Supabase__ServiceRoleKey`: server-only secret used to delete a user's login on account deletion. Never prefix it with `NEXT_PUBLIC_`, and never commit it. If it's unset, account deletion returns 502 and removes nothing.
  - `Cors__AllowedOrigins__N`: browser origins allowed to call the API (default `http://localhost:3000`).

### Option A: Docker Compose (recommended)
```bash
docker compose up
```
- client: `node:22` runs `npm install && npm run dev` on port 3000
- server: `dotnet/sdk:10.0` runs `dotnet watch run`. Host port `5083` maps to container port `8080`.

### Option B: run separately
Backend (from `server/`). The `http` launch profile listens on `http://localhost:5083`:
```bash
cd server
dotnet watch run
# apply migrations (needs the dotnet-ef tool and a connection string)
dotnet ef database update
```

Frontend (from `client/`):
```bash
cd client
npm install
npm run dev        # http://localhost:3000
```

Other client scripts: `npm run build`, `npm run lint`, `npm run type-check`, `npm test` (Vitest), `npm run e2e` (Playwright).

Security note: never commit secrets (`.env`, `client/.env.local`, `server/.env`, `server/appsettings.Development.json`, `supabase/signing_keys.json`).

---

## Supabase Auth setup

Configure the hosted Supabase project (Dashboard) once:

1. Authentication > Providers > Email: turn **Confirm email** on.
2. Authentication > Providers > Email: set **Minimum password length** to `8`.
3. Authentication > URL Configuration: set **Site URL** to the deployed client origin (`http://localhost:3000` locally).
4. Authentication > URL Configuration: add `<site origin>/**` to **Redirect URLs** (`http://localhost:3000/**` locally).
5. Authentication > Email Templates > **Confirm signup**: use the link
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/`
   (see `supabase/templates/confirmation.html`).
6. Authentication > Email Templates > **Reset password**: use the link
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password`
   (see `supabase/templates/recovery.html`).
7. Authentication > JWT Keys: the hosted project must use **asymmetric JWT signing keys** (JWKS, e.g. ES256), not the legacy shared secret. The API validates tokens against `/auth/v1/.well-known/openid-configuration`, so check that the project publishes a key at `/auth/v1/.well-known/jwks.json` before deploying.

`supabase/config.toml` mirrors these settings for the local Supabase CLI test stack.

### Making an admin

Admins can import and delete funding opportunities from the **Admin** page. Run this once in the Supabase SQL editor, then sign out and back in:

```sql
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '<your email>';
```

---

## Tests

### API tests (xUnit)
These use an in-memory database and a test-only authentication handler. They never connect to Supabase and need no secrets.

```bash
dotnet test server.tests/LumenPatrons.Api.Tests.csproj --collect:"XPlat Code Coverage"
```

Folders in `server.tests/`:
- `Security/`: anonymous rejection, owner isolation, user-ID spoofing, the admin policy, and profile provisioning
- `Features/`: account export/deletion, error handling, import, search, and saved status
- `Unit/Auth/`: claims helpers, `SupabaseAuthAdmin`, `SupabaseUrl`

Coverage is written as Cobertura XML under `server.tests/TestResults/`.

### Client unit tests (Vitest)
```bash
cd client && npm test
```

### E2E tests (Playwright)
Playwright tests run against the local Supabase CLI stack (Docker required), never hosted Supabase. From the repository root:

```bash
echo '[]' > supabase/signing_keys.json && npx supabase gen signing-key --algorithm ES256 --append
npx supabase start
eval "$(npx supabase status -o env)"
export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${PUBLISHABLE_KEY:-$ANON_KEY}"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"   # local stack's key only, never a hosted one
export ConnectionStrings__SupabaseConnection="Host=127.0.0.1;Port=54322;Database=postgres;Username=postgres;Password=postgres"
(cd server && dotnet ef database update)
cd client && npm run e2e
```

Specs: `auth.spec.ts` (auth flows, using Mailpit for emails) and `journey.spec.ts` (the core user journey and account deletion).

### CI
`.github/workflows/security-tests.yml` runs on pushes and PRs to `main`:
- `api-security`: build with warnings as errors, then the xUnit tests with coverage
- `client`: type-check, lint, Vitest
- `e2e` (PRs only): local Supabase, migrations, then Playwright on Chromium

---

## Current status
- Frontend: Discover, opportunity detail, saved patrons, settings (profile, theme, export, delete account) and the admin import page all use the real API and Supabase Auth.
- Backend: CRUD, search and category filters, bulk import, account export and deletion. Migrations are present.
- Security: JWT validation (JWKS), owner-scoped user endpoints, admin-only mutations, DTO responses, uniqueness constraints, Supabase RLS policies, and configurable CORS.
- Data: scrapers run locally. Data enters through Admin → Import.

---

## Known issues & notes
- Apply the latest EF migration before using the authenticated profile and saved-opportunity flows.
- Enable Supabase Auth leaked-password protection before production.
- List endpoints return at most 1000 rows. Filtering by category happens in memory.

---

## Recommended next steps
1. Enable leaked-password protection in Supabase Auth.
2. See `PRODUCTION_BACKLOG.md` for the long-term list.

---

## Where to look in the code
- Frontend
  - Layout: `client/app/layout.tsx`
  - Route protection: `client/proxy.ts`
  - Pages: `client/app/(app)/*`, `client/app/(auth)/auth/*`
  - Auth provider: `client/providers/AuthProvider.tsx`
  - API client: `client/lib/api.ts`
  - Components: `client/components/*`
- Backend
  - Startup: `server/Program.cs`
  - Controllers: `server/Controllers/*.cs`
  - DTOs: `server/Contracts/ApiContracts.cs`
  - Services: `server/Services/*.cs`
  - Models: `server/Models/AppModels.cs`
  - DbContext: `server/Data/AppDbContext.cs`
  - Migrations: `server/Migrations/`
- Tests: `server.tests/`, `client/e2e/`, `client/lib/*.test.ts`
- Supabase: `supabase/config.toml`, `supabase/templates/`
- Docker: `docker-compose.yml`
