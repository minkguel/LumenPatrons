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

/** Returns `next` only if it is a same-origin, non-auth path; otherwise "/". */
export function safeRedirect(next: string | null | undefined): string {
  if (!next || !/^\/(?![\/\\])/.test(next)) return "/";
  const pathname = next.split(/[?#]/)[0];
  return isAuthPath(pathname) ? "/" : next;
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
