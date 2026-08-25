# LumenPatrons

SaaS product to help founders and researchers find, track and apply for non‑dilutive funding (grants, stipends, institutional backing) with less noise.

This README consolidates the project goal, tech stack, repo layout, what’s implemented (frontend + backend), available endpoints, quick start commands, current status, known issues, and recommended next steps.

---

## Project goal
Make it easy to discover, save and apply for non‑dilutive funding opportunities (grants, stipends, institutional programs) by providing a curated feed, saved applications, and tooling to manage applications and alerts.

---

## Tech stack
- Frontend: Next.js (app router), React, TypeScript
- Backend: C#, ASP.NET Core Web API, Entity Framework Core
- Database: PostgreSQL (Supabase in development config)
- Containerization: Docker (docker-compose)
- Hosting suggestion: Vercel (frontend)
- Scraper/ingestion (future): Playwright / Selenium / Crawlee / custom

---

## Repository layout (monorepo)
- `LumenPatrons/`
  - `client/` — Next.js frontend (TypeScript)
  - `server/` — .NET API (C#)
  - `README.md` (this file)
  - `stack.md`, `docker-compose.yml`

---

## What’s implemented

### Frontend (client)
- Root layout: `client/app/layout.tsx` — loads fonts and wraps app with `AuthProvider`.
- Styles: `client/app/globals.css` — theme variables.
- Pages:
  - `client/app/(app)/page.tsx` — "Discover Patrons" home page rendering mock opportunities.
  - `client/app/(auth)` — auth pages & layout scaffold.
- Components:
  - `client/components/layout/*` — Sidebar, Topbar, AppShell, StatusWidget, NavLink.
  - Other UI components for applications, settings, and UI primitives under `client/components/*`.
- Authentication:
  - `client/providers/AuthProvider.tsx` & `client/lib/auth.ts` — Supabase Auth sign-in, sign-up, sign-out, and session restoration.
- API client helper:
  - `client/lib/api.ts` — `getSystemStatus()` calls backend `/api/v1/status`.
- Notes:
  - Discover uses the real API. Applications and settings still use mock data and need wiring to the protected endpoints.

### Backend (server)
- Startup: `server/Program.cs`
  - Registers `AppDbContext` (Postgres/Supabase), CORS policy (allows `http://localhost:3000`), controllers, and OpenAPI in development.
  - Adds GET `/api/v1/status` that pings the database.
- Controllers:
  - `server/Controllers/FundingOpportunitiesController.cs` — full CRUD + query filters.
  - `server/Controllers/SavedOpportunitiesController.cs` — saved items per user, CRUD.
  - `server/Controllers/UserProfilesController.cs` — user profile CRUD.
- Models: `server/Models/AppModels.cs`
  - `UserProfile`, `FundingOpportunity`, `SavedOpportunity`
- DbContext: `server/Data/AppDbContext.cs` (DbSets for the three models)
- Config:
  - `server/appsettings.Development.json` contains a `SupabaseConnection` string (treat as a secret).
- Migrations folder present.

---

## Available backend endpoints (summary)
- GET `/api/v1/status` — service + database connectivity
- Funding opportunities
  - GET `/api/v1/fundingopportunities` — public
  - GET `/api/v1/fundingopportunities/{id}` — public
  - POST/PUT/DELETE — requires an authenticated user with `app_metadata.role = admin`
- Saved opportunities
  - GET `/api/v1/savedopportunities` — current user's items
  - GET/PUT/DELETE `/api/v1/savedopportunities/{id}` — owner only
  - POST `/api/v1/savedopportunities` — ownership comes from the JWT, never the request body
- User profiles
  - GET/PUT/DELETE `/api/v1/userprofiles/me` — current user only

All protected endpoints require `Authorization: Bearer <Supabase access token>`.

---

## Quick start — local development

Two main options: run the whole stack with Docker Compose, or run frontend and backend separately.

Notes:
- Frontend default API base (fallback) is `http://localhost:5083` (see `client/lib/api.ts`). If your backend runs on a different port, set `NEXT_PUBLIC_API_URL` accordingly.
- Docker compose in this repo maps the server host port `5083` to container `8080`. If you use docker compose, use `http://localhost:5083` for the API unless you change mapping.

Option A — Docker Compose (recommended quick dev)
- From repo root:
  - sh / macOS / Linux:
    - `docker compose up`
  - PowerShell (Windows):
    - `docker compose up`
- This will:
  - Start the client container which runs `npm run dev` and exposes port 3000
  - Start the server container running `dotnet watch run` and mapping host port `5083` -> container `8080`
- If running the client locally (not in container), ensure `NEXT_PUBLIC_API_URL` points to `http://localhost:5083` (or whichever host/port the server is reachable at).

Option B — Run frontend and backend separately

1) Start backend
- Using dotnet (from `server/`):
  - sh:
    - `cd server`
    - `dotnet watch run --urls "http://0.0.0.0:5083"`
  - PowerShell:
    - `$env:ASPNETCORE_ENVIRONMENT="Development"`
    - `cd server`
    - `dotnet watch run --urls "http://0.0.0.0:5083"`
- Or run normally:
  - `dotnet run`
- If you need to apply EF migrations:
  - `dotnet ef database update`
  - (Requires dotnet-ef tool and proper connection string configuration.)

2) Start frontend
- From `client/`:
  - `npm install`
  - Set API URL and run:
    - sh:
      - `export NEXT_PUBLIC_API_URL=http://localhost:5083`
      - `npm run dev`
    - PowerShell:
      - `$env:NEXT_PUBLIC_API_URL="http://localhost:5083"`
      - `npm run dev`
- Open http://localhost:3000

Example environment variables (recommended)
- Frontend:
  - `NEXT_PUBLIC_API_URL` — e.g. `http://localhost:5083`
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — browser-safe publishable key; never use a secret/service-role key
- Backend:
  - `ConnectionStrings__SupabaseConnection` env var or update `server/appsettings.Development.json`:
    - `ConnectionStrings__SupabaseConnection="Host=...;Port=5432;Database=...;Username=...;Password=...;"`
  - `Supabase__Url` — same Supabase project URL, used for JWT issuer/JWKS validation

Security note: do not commit production secrets to the repository. Use environment variables, a secrets store, or a local `.env` (gitignored).

---

## Current status
- Frontend: UI shell and pages implemented; real Supabase Auth and funding API are wired; applications/settings remain mock.
- Backend: controllers, models, DbContext and a status endpoint implemented; migrations are present.
- Security: JWT validation, owner-scoped user endpoints, admin-only funding mutations, DTO responses, uniqueness constraints, and Supabase RLS policies are implemented in code.

---

## Known issues & notes
- Port mismatch: frontend client fallback API is `http://localhost:5083` while docker-compose maps server to host `5000`. Set `NEXT_PUBLIC_API_URL` to the actual backend URL.
- `appsettings.Development.json` currently contains a connection string — treat that value as sensitive.
- Apply the latest EF migration before using authenticated profile/saved-opportunity flows.
- Enable Supabase Auth leaked-password protection before production.
- No E2E tests at present.

---

## Recommended next steps (prioritized)
1. Apply the `SecurityFoundation` migration and enable leaked-password protection in Supabase Auth.
2. Wire Applications and Settings to the protected API endpoints.
3. Create a small data ingestion pipeline to populate `FundingOpportunity` records.
4. Add tests and basic CI; automate EF migrations in dev/CI.

---

## Where to look in the code
- Root: `LumenPatrons/README.md` (this file)
- Frontend:
  - Layout: `client/app/layout.tsx`
  - Home: `client/app/(app)/page.tsx`
  - Auth provider: `client/providers/AuthProvider.tsx`
  - Mock auth: `client/lib/auth.ts`
  - API client: `client/lib/api.ts`
  - UI components: `client/components/*`
- Backend:
  - Startup: `server/Program.cs`
  - Controllers: `server/Controllers/*.cs`
  - Models: `server/Models/AppModels.cs`
  - DbContext: `server/Data/AppDbContext.cs`
  - Config: `server/appsettings.Development.json`
- Docker compose: `docker-compose.yml`

---
