
*Containerization*
Docker

*Web Hosting*
Vercel, Hosting + DNS

*Cloud Database*
Supabase, Cloud database (maybe move to local db if slow)

*Frontend*
Next.js
React
TypeScript 7

*Backend*
C#
.NET Core Entity Framework

*Scraper*
Scraper options:
- Selenium
- Playwright, .NET + Python + Node.js
- LibreCrawl
- Build my own? "https://www.scrapingbee.com/blog/web-scraping-csharp/"
- Crawlee, Node.js + Python
- FireCrawl, if the other options don't work


*Project Structure* (monorepo)
lumenpatrons/
├── client/          <-- Next.js (TypeScript 7)
├── server/          <-- C# .NET Core API
└── README.md

*Running the Project*
docker compose up
