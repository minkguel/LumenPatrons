import { describe, expect, it } from "vitest";
import { PUBLIC_AUTH_PATHS, decideRedirect, hasSessionCookie, safeRedirect } from "@/lib/auth/redirects";

describe("safeRedirect", () => {
  it.each(["/applications", "/a?b=1", "/settings#x"])("keeps %s", (p) => expect(safeRedirect(p)).toBe(p));
  it.each(["//evil.com", "/\\evil.com", "https://evil.com", "javascript:alert(1)", "", null, undefined, "applications"])(
    "rejects %s", (p) => expect(safeRedirect(p as string)).toBe("/"));
  it.each(["/\t/evil.com", "/\n/evil.com", "/\t\\evil.com", "/\r//evil.com", "/a\tb"])(
    "rejects control characters in %j", (p) => expect(safeRedirect(p)).toBe("/"));
  it("keeps a percent-encoded tab as a same-origin path", () => {
    const out = safeRedirect("/%09/evil.com");
    expect(out).toMatch(/^\/(?![\/\\])/);
    expect(new URL(out, "http://x").origin).toBe("http://x");
  });
  it.each(["/auth", "/auth?tab=signup", "/auth/check-email"])("maps auth path %s to /", (p) => expect(safeRedirect(p)).toBe("/"));
  it("keeps paths that merely start with the letters auth", () => expect(safeRedirect("/authors")).toBe("/authors"));
});

describe("decideRedirect", () => {
  it("sends signed-out app visits to /auth with next incl. query", () =>
    expect(decideRedirect("/applications", "?status=draft", false, false))
      .toEqual({ redirectTo: "/auth?next=%2Fapplications%3Fstatus%3Ddraft" }));
  it("adds reason=expired when a session cookie was present", () =>
    expect(decideRedirect("/", "", false, true)).toEqual({ redirectTo: "/auth?next=%2F&reason=expired" }));
  it("sends signed-in /auth to safeRedirect(next)", () =>
    expect(decideRedirect("/auth", "?next=%2Fsettings", true, true)).toEqual({ redirectTo: "/settings" }));
  it("sends signed-in /auth with no next to /", () =>
    expect(decideRedirect("/auth", "", true, true)).toEqual({ redirectTo: "/" }));
  it.each(PUBLIC_AUTH_PATHS)("passes %s either way", (p) => {
    expect(decideRedirect(p, "", false, false)).toBeNull();
    expect(decideRedirect(p, "", true, true)).toBeNull();
  });
  it("sends signed-out reset-password to forgot-password", () =>
    expect(decideRedirect("/auth/reset-password", "", false, false)).toEqual({ redirectTo: "/auth/forgot-password" }));
  it("passes signed-in reset-password and app pages", () => {
    expect(decideRedirect("/auth/reset-password", "", true, true)).toBeNull();
    expect(decideRedirect("/applications", "", true, true)).toBeNull();
  });
  it("passes signed-out /auth", () => expect(decideRedirect("/auth", "", false, false)).toBeNull());
  it("treats /auth with a query as the /auth page", () => {
    expect(decideRedirect("/auth", "?tab=signup", false, false)).toBeNull();
    expect(decideRedirect("/auth", "?tab=signup&next=%2Fa", true, true)).toEqual({ redirectTo: "/a" });
  });
});

describe("hasSessionCookie", () => {
  it("detects the Supabase auth token cookie and its chunks", () => {
    expect(hasSessionCookie(["sb-127-auth-token"])).toBe(true);
    expect(hasSessionCookie(["other", "sb-127-auth-token.0"])).toBe(true);
  });
  it("ignores PKCE code-verifier cookies", () =>
    expect(hasSessionCookie(["sb-127-auth-token-code-verifier"])).toBe(false));
  it("is false without any auth cookie", () => expect(hasSessionCookie(["theme"])).toBe(false));
});

describe("safeRedirect dot-segment protocol-relative inputs", () => {
  const hostile = [
    "/.//evil.com",
    "/..//evil.com",
    "/%2e%2e//evil.com",
    "/.%2e//evil.com",
    "/x/..//evil.com",
    "/./\\evil.com",
    "/x/../\\evil.com",
  ];
  it.each(hostile)("rejects %s", (p) => expect(safeRedirect(p)).toBe("/"));
  it("never leaves the site origin for hostile inputs", () => {
    for (const x of [...hostile, "/\t/evil.com", "//evil.com", "/\evil.com"]) {
      expect(new URL(safeRedirect(x), "http://site.test/").host).toBe("site.test");
    }
  });
});
