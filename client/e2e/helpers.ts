import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { expect, type Page } from "@playwright/test";
import { EXPECT_TIMEOUT_MS, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import { latestLinkFor } from "./mailpit";

export const FULL_NAME = "E2E Tester";
export const PASSWORD = "e2e-password-1";
export const NEW_PASSWORD = "e2e-password-2";

export function uniqueEmail(): string {
  return `e2e+${randomUUID()}@example.com`;
}

/**
 * Waits for pathname + search of the current page, so assertions ignore the origin.
 * Uses the raised expect timeout: the first visit to a route can include compile time.
 */
export async function expectLocation(page: Page, expected: string | RegExp) {
  const location = () => {
    const url = new URL(page.url());
    return url.pathname + url.search;
  };
  const poll = expect.poll(location, { timeout: EXPECT_TIMEOUT_MS });
  if (typeof expected === "string") {
    await poll.toBe(expected);
  } else {
    await poll.toMatch(expected);
  }
}

/** Waits for the pathname only (query string ignored). */
export async function expectPath(page: Page, pathname: string) {
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: EXPECT_TIMEOUT_MS })
    .toBe(pathname);
}

export async function signUp(page: Page, email: string) {
  await page.goto("/auth?tab=signup");
  await page.getByLabel("Full Name", { exact: true }).fill(FULL_NAME);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expectLocation(page, /^\/auth\/check-email\?email=/);
}

export async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  // The tab switcher also says "Sign In"; the submit button is the one inside the form.
  await page.locator("form").getByRole("button", { name: "Sign In" }).click();
}

/** Signs up and follows the confirmation email; the page ends signed in on `/`. */
export async function signUpConfirmed(page: Page): Promise<{ email: string; confirmLink: string }> {
  const email = uniqueEmail();
  await signUp(page, email);
  const confirmLink = await latestLinkFor(email, "signup");
  await page.goto(confirmLink);
  await expectLocation(page, "/");
  return { email, confirmLink };
}

/**
 * Reads the session from the browser's cookie session. @supabase/ssr owns the cookie
 * format (chunking, base64 prefix), so a cookie-backed server client decodes it for us.
 */
async function browserSession(page: Page) {
  const cookies = await page.context().cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookies.map(({ name, value }) => ({ name, value })),
      setAll: () => {},
    },
  });
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("No Supabase session in the browser cookies.");
  return data.session;
}

export async function accessToken(page: Page): Promise<string> {
  return (await browserSession(page)).access_token;
}

export async function currentUserId(page: Page): Promise<string> {
  return (await browserSession(page)).user.id;
}
