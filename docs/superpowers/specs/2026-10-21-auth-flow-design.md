# Auth Flow Design (Sign Up, Login, Session Handling)

**Date:** 2026-10-21
**Backlog:** HR-006 (complete authentication and session handling), HR-005 (one profile per confirmed user)
**Status:** Approved design, pending implementation plan

## Goal

A user can sign up, confirm their email, sign in, stay signed in across reloads, recover from an expired session, reset a forgotten password, and sign out — with a `UserProfile` row created automatically — and every page under `(app)` is reachable only with a valid session.

## Decisions

- **Supabase stays** for Auth and the database. Production uses hosted Supabase.
- **Email confirmation is required.** No session is issued until the email is confirmed.
- **Cookie sessions via `@supabase/ssr`** replace the current localStorage session, so the server (proxy, server components, route handlers) can read the user.
- **Route protection lives in `client/proxy.ts`** (Next.js 16's name for middleware). Everything under `(app)`, including Discover (`/`), requires a session.
- **Email links use `token_hash` + `verifyOtp`** at `/auth/confirm`, not the default PKCE code link, so a link opened on another device still works.
- **Profiles are provisioned by the client** through the existing idempotent `PUT /api/v1/userprofiles/me`. No database trigger: the EF-managed schema and test databases have no `auth` schema.
- **Minimum password length is 8**, enforced in the client and in Supabase Auth settings.
- **No new API endpoints.**

## Out of scope

Social/OAuth login, MFA, account deletion and data export (HR-007), the profile editing UI (Settings wiring), and production SMTP/email deliverability (HR-026).

## 1. Routes and modules

### Routes

| Route | Kind | Purpose | Access |
|---|---|---|---|
| `/auth?tab=signin\|signup&next=/path&reason=expired` | page | Existing sign-in / sign-up tabs | Signed-out only; a signed-in user is redirected to `safeRedirect(next)` |
| `/auth/check-email?email=…` | page | "Check your inbox" + Resend (60 s cooldown) | Public |
| `/auth/confirm?token_hash=…&type=signup\|recovery&next=…` | route handler | `verifyOtp`, sets session cookie, redirects to `safeRedirect(next)` | Public |
| `/auth/forgot-password` | page | Email field → sends reset link | Public |
| `/auth/reset-password` | page | New password form | Session required (redirect to `/auth/forgot-password` if none) |
| `/auth/error?type=signup\|recovery` | page | Invalid/expired link; offers resend or new reset link, and "Back to sign in" | Public |
| `(app)/*` (`/`, `/applications`, `/settings`) | pages | The app | Session required |

All `/auth/*` pages render inside the existing `(auth)` layout.

### Client modules

| File | Responsibility |
|---|---|
| `lib/supabase/browser.ts` | `createBrowserClient` singleton for client components. Replaces `lib/supabase.ts`; keeps its missing-env error. |
| `lib/supabase/server.ts` | `createServerClient` bound to `next/headers` `cookies()`, for server components and route handlers. |
| `proxy.ts` | Refreshes the session on every matched request (`auth.getUser()`), writes refreshed cookies to the response, and applies `decideRedirect`. Matcher excludes `_next/static`, `_next/image`, `favicon.ico`, and image files. |
| `lib/auth/redirects.ts` | `safeRedirect(next)` and the pure `decideRedirect(pathname, hasUser)` used by `proxy.ts`. |
| `lib/auth.ts` | Keeps `signIn`, `signUp`, `signOut`, `getAccessToken`, `onAuthStateChange`, `getCurrentUser`; adds `resendConfirmation(email)`, `requestPasswordReset(email)`, `updatePassword(password)`, `ensureProfile()`, `toAuthMessage(error)`. Uses the browser client. |
| `lib/api.ts` | `authorizedFetch` handles 401 (see §2, Expired session). |
| `providers/AuthProvider.tsx` | Same context shape (`user`, `isLoading`, `signIn`, `signUp`, `signOut`); `isLoading` now means "initial session restore" only. Calls `ensureProfile()` once per new session. Redirects to `/auth` on `SIGNED_OUT`. |
| `app/(auth)/auth/confirm/route.ts` | The `/auth/confirm` route handler. |
| `components/auth/SignInForm.tsx`, `SignUpForm.tsx` | Split out of `AuthForm.tsx`; each owns its own pending/error state. `AuthForm.tsx` remains the tab container. |
| `components/auth/CheckEmail.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `AuthLinkError.tsx` | One component per new page. |

### Server

No changes to production code. New tests only (§4).

### Supabase project configuration (setup step, documented in README)

- Auth → Email: "Confirm email" **on**; minimum password length **8**.
- Auth → URL configuration: Site URL = app origin; add `http://localhost:3000/**` to redirect URLs.
- Email templates:
  - Confirm signup link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/`. `next` is fixed in the template (Supabase's `{{ .RedirectTo }}` is a full URL, not a path), so `signUp` and `resetPasswordForEmail` pass no redirect option.
  - Reset password link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password`
- The same templates are set in `supabase/config.toml` for the local stack (§4).

## 2. Flows

### Sign up

1. `SignUpForm` validates (all fields, email format, password ≥ 8) and calls `supabase.auth.signUp({ email, password, options: { data: { full_name, user_type } } })`.
2. On success, it navigates to `/auth/check-email?email=<email>`.
3. Check-email shows the address and a **Resend** button calling `auth.resend({ type: "signup", email })`, disabled for 60 s after each send.
4. The user clicks the email link → `/auth/confirm` calls `verifyOtp({ token_hash, type })`. Success: session cookie set, redirect to `safeRedirect(next)`. Failure: redirect to `/auth/error?type=signup`.

### Profile provisioning

`ensureProfile()` runs from `AuthProvider` once each time a session appears (initial restore or `SIGNED_IN`), deduplicated per user id for the lifetime of the provider:

1. `GET /api/v1/userprofiles/me` via `authorizedFetch`.
2. `200` → done. `404` → `PUT /api/v1/userprofiles/me` with `{ fullName: user_metadata.full_name, userType: user_metadata.user_type }`, falling back to the email local-part and `"Founder"` as `toAuthUser` does today.
3. Any other failure is logged with `console.error` and never thrown; the app keeps working and the next session retries.

### Sign in

1. `SignInForm` validates and calls `signInWithPassword`.
2. Success: `router.replace(safeRedirect(next))` then `router.refresh()`.
3. `email_not_confirmed`: show the message and a Resend button (same call as check-email).
4. When `reason=expired` is in the URL, show "Your session expired. Please sign in again." above the form.

### Sign out

`signOut()` → `router.replace("/auth")` → `router.refresh()`. Other tabs receive `SIGNED_OUT` through `onAuthStateChange` and redirect to `/auth`.

### Expired session

- **Navigation:** `proxy.ts` calls `auth.getUser()` on each request, which refreshes tokens. If there is no valid user on a protected path, it redirects to `/auth?next=<pathname+search>&reason=expired` when a Supabase auth cookie was present, or `/auth?next=<pathname+search>` when none was.
- **API calls:** if the .NET API returns `401`, `authorizedFetch` calls `signOut({ scope: "local" })` and assigns `window.location` to `/auth?next=<current path>&reason=expired`.

### Password reset

1. `/auth/forgot-password` calls `resetPasswordForEmail(email)` and always shows "If an account exists for that email, we've sent a reset link."
2. Link → `/auth/confirm` (`type=recovery`) → session set → `/auth/reset-password`. Failure → `/auth/error?type=recovery`.
3. Reset form validates (≥ 8, matching confirmation field) and calls `updateUser({ password })`, then `router.replace("/")`.

### Redirect rules (`decideRedirect(pathname, hasUser)`)

| Path | No user | User |
|---|---|---|
| `/auth` | pass | → `/` (or `safeRedirect(next)`) |
| `/auth/check-email`, `/auth/confirm`, `/auth/forgot-password`, `/auth/error` | pass | pass |
| `/auth/reset-password` | → `/auth/forgot-password` | pass |
| anything else (the `(app)` group) | → `/auth?next=…` | pass |

## 3. Error handling

### `toAuthMessage(error)` mapping (by Supabase `error.code`)

| Code | Message / behavior |
|---|---|
| `invalid_credentials` | "Email or password is incorrect." |
| `email_not_confirmed` | "Please confirm your email first." + Resend button |
| `user_already_exists` | Not shown; sign-up proceeds to check-email as for a new account |
| `weak_password` | "Password must be at least 8 characters." |
| `over_email_send_rate_limit`, `over_request_rate_limit` | "Too many attempts. Please wait a minute and try again." |
| anything else, including network errors | "Something went wrong. Please try again." (original error logged) |

Raw Supabase messages are never rendered.

### Other rules

- **Link failures:** missing `token_hash`, unknown `type`, expired, or already-used token → `/auth/error?type=…`.
- **`safeRedirect(next)`** returns `next` only if it starts with exactly one `/`, is not `/\…`, and contains no scheme; otherwise `/`. Used in `proxy.ts`, `/auth/confirm`, and `SignInForm`.
- **Forms:** client validation first; submit button disabled while pending; per-form pending state (the global `isLoading` no longer flips during sign-in/up/out).
- **Missing env vars:** creating either Supabase client throws a clear configuration error, as today.

## 4. Testing

### Unit (new: Vitest in `client/`)

- `safeRedirect`: accepts `/applications`, `/a?b=1`; rejects `//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:alert(1)`, `""`, `null`.
- `decideRedirect`: every row of the redirect table.
- `toAuthMessage`: every row of the mapping table, plus an unknown code and a non-Supabase `Error`.
- `ensureProfile`: 200 → no PUT; 404 → exactly one PUT with metadata-derived body; fetch rejection → resolves without throwing.

### API (xUnit, `server.tests/Security`, existing `SecurityWebApplicationFactory`/`TestAuthHandler`)

- `GET /userprofiles/me` returns 404 before provisioning.
- First `PUT /me` creates the profile; a second `PUT` updates the same row (row count stays 1).
- `Email` is taken from the token's `email` claim, never from the request body.

### Browser (new: Playwright in `client/e2e/`, local Supabase stack)

Runs against `supabase start` (Supabase CLI, Docker), configured by a committed `supabase/config.toml` with the templates and settings from §1. Tests read emails from the stack's Mailpit API. This stack is a test harness only; production stays on hosted Supabase.

- Sign up → check-email → confirm link → lands on `/` → `GET /userprofiles/me` is 200.
- Sign in with an unconfirmed account → message and Resend shown.
- Signed-out visit to `/applications` → `/auth?next=/applications` → sign in → `/applications`.
- Sign out → `/auth`; visiting `/` redirects back to `/auth`.
- Forgot password → reset link → new password → signed in at `/`; old password rejected.
- Reused or tampered confirm link → `/auth/error`.
- Signed-in visit to `/auth` → `/`.

### CI

- Existing workflow gains a `client` job: `npm ci`, `type-check`, `lint`, `vitest run`.
- New `e2e` job on pull requests: install Supabase CLI, `supabase start`, apply EF migrations, start API and client, run Playwright.

## Success criteria

- Every flow in §2 works end to end in the Playwright suite.
- No page under `(app)` renders for a signed-out request.
- Every confirmed user who signs in has exactly one `UserProfile` row.
- Unit, API, and browser suites pass in CI.
