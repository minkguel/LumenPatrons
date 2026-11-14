*Containerization*
Docker Compose (local dev: node:22 + dotnet/sdk:10.0)

*Web Hosting*
Vercel, Hosting + DNS

*Cloud Database*
Supabase: PostgreSQL + Supabase Auth (JWT, asymmetric/JWKS keys), row-level security

*Frontend*
Next.js 16 (App Router)
React 19
TypeScript 5.9
Tailwind CSS 4
@supabase/ssr + @supabase/supabase-js

*Backend*
C# / ASP.NET Core Web API (.NET 10)
Entity Framework Core 10 + Npgsql
JWT bearer auth against Supabase

*Testing*
API: xUnit v3, in-memory EF Core, coverlet coverage
Client: Vitest (unit), Playwright (E2E against the local Supabase CLI stack)

*CI*
GitHub Actions: API tests, client type-check/lint/unit, E2E on PRs

*Scraper* (run locally, not deployed)
Python: Scrapy, Crawl4AI, BeautifulSoup
Output JSON is imported via Admin → Import

*Project Structure* (monorepo)
lumenpatrons/
├── client/          <-- Next.js (TypeScript)
├── server/          <-- ASP.NET Core API (.NET 10)
├── server.tests/    <-- xUnit API tests
├── supabase/        <-- local Supabase config + email templates
├── scraper/         <-- Python scrapers
├── docs/            <-- specs and plans
└── README.md

*Running the Project*
docker compose up
(needs client/.env.local and server/.env, see .env.example)
