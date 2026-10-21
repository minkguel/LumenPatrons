export const PUBLIC_AUTH_PATHS: readonly string[] = [
  "/auth/check-email",
  "/auth/confirm",
  "/auth/forgot-password",
  "/auth/error",
];

export type RedirectDecision = { redirectTo: string } | null;

function isAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

/** True if a Supabase session cookie is present (PKCE code-verifier cookies are not a session). */
export function hasSessionCookie(cookieNames: string[]): boolean {
  return cookieNames.some(
    (name) => name.startsWith("sb-") && name.includes("-auth-token") && !name.endsWith("-code-verifier"),
  );
}

const BASE = "http://x";
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

/** Returns `next` only if it is a same-origin, non-auth path; otherwise "/". */
export function safeRedirect(next: string | null | undefined): string {
  if (!next || !/^\/(?![\/\\])/.test(next) || CONTROL_CHARS.test(next)) return "/";
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return "/";
  }
  if (url.origin !== BASE) return "/";
  if (isAuthPath(url.pathname)) return "/";
  const out = url.pathname + url.search + url.hash;
  // Dot-segment resolution can yield "//host"; re-check and require idempotence.
  if (!/^\/(?![\/\\])/.test(out)) return "/";
  try {
    const again = new URL(out, BASE);
    if (again.origin !== BASE || again.pathname + again.search + again.hash !== out) return "/";
  } catch {
    return "/";
  }
  return out;
}

export function decideRedirect(
  pathname: string,
  search: string,
  hasUser: boolean,
  hadSessionCookie: boolean,
): RedirectDecision {
  if (PUBLIC_AUTH_PATHS.includes(pathname)) return null;

  if (pathname === "/auth") {
    if (!hasUser) return null;
    const next = new URLSearchParams(search).get("next");
    return { redirectTo: safeRedirect(next) };
  }

  if (pathname === "/auth/reset-password") {
    return hasUser ? null : { redirectTo: "/auth/forgot-password" };
  }

  if (hasUser) return null;
  const next = encodeURIComponent(pathname + search);
  const reason = hadSessionCookie ? "&reason=expired" : "";
  return { redirectTo: `/auth?next=${next}${reason}` };
}
