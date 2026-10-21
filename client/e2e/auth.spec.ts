import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { expect, test, type Page } from "@playwright/test";
import { API_URL, EXPECT_TIMEOUT_MS, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import { latestLinkFor } from "./mailpit";

const FULL_NAME = "E2E Tester";
const PASSWORD = "e2e-password-1";
const NEW_PASSWORD = "e2e-password-2";

function uniqueEmail(): string {
  return `e2e+${randomUUID()}@example.com`;
}

/**
 * Waits for pathname + search of the current page, so assertions ignore the origin.
 * Uses the raised expect timeout: the first visit to a route can include compile time.
 */
async function expectLocation(page: Page, expected: string | RegExp) {
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
async function expectPath(page: Page, pathname: string) {
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: EXPECT_TIMEOUT_MS })
    .toBe(pathname);
}

async function signUp(page: Page, email: string) {
  await page.goto("/auth?tab=signup");
  await page.getByLabel("Full Name", { exact: true }).fill(FULL_NAME);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expectLocation(page, /^\/auth\/check-email\?email=/);
}

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  // The tab switcher also says "Sign In"; the submit button is the one inside the form.
  await page.locator("form").getByRole("button", { name: "Sign In" }).click();
}

/** Signs up and follows the confirmation email; the page ends signed in on `/`. */
async function signUpConfirmed(page: Page): Promise<{ email: string; confirmLink: string }> {
  const email = uniqueEmail();
  await signUp(page, email);
  const confirmLink = await latestLinkFor(email, "signup");
  await page.goto(confirmLink);
  await expectLocation(page, "/");
  return { email, confirmLink };
}

/**
 * Reads the access token from the browser's cookie session. @supabase/ssr owns the cookie
 * format (chunking, base64 prefix), so a cookie-backed server client decodes it for us.
 */
async function accessToken(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => cookies.map(({ name, value }) => ({ name, value })),
      setAll: () => {},
    },
  });
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("No Supabase session in the browser cookies.");
  return data.session.access_token;
}

test("sign up, confirm, land on Discover with a profile", async ({ page }) => {
  await signUpConfirmed(page);
  await expect(page.getByRole("button", { name: FULL_NAME })).toBeVisible();

  const token = await accessToken(page);
  await expect
    .poll(
      async () => {
        const response = await page.request.get(`${API_URL}/api/v1/userprofiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.status();
      },
      { timeout: 5_000 },
    )
    .toBe(200);
});

test("unconfirmed sign-in offers resend", async ({ page }) => {
  const email = uniqueEmail();
  await signUp(page, email);

  await page.goto("/auth");
  await signIn(page, email, PASSWORD);

  await expect(page.getByText("Please confirm your email first.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend confirmation email" })).toBeVisible();
  await expectLocation(page, "/auth");
});

test("signed-out deep link returns after login", async ({ page }) => {
  const { email } = await signUpConfirmed(page);
  await page.context().clearCookies();

  await page.goto("/applications?status=draft");
  await expectLocation(page, /^\/auth\?.*next=/);

  await signIn(page, email, PASSWORD);
  await expectLocation(page, "/applications?status=draft");
});

test("sign out then / redirects to /auth", async ({ page }) => {
  await signUpConfirmed(page);

  await page.getByRole("button", { name: FULL_NAME }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expectPath(page, "/auth");

  await page.goto("/");
  await expectPath(page, "/auth");
});

test("forgot + reset password; old password rejected", async ({ page }) => {
  const { email } = await signUpConfirmed(page);
  await page.context().clearCookies();

  await page.goto("/auth/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText("If an account exists for that email, we've sent a reset link."),
  ).toBeVisible();

  await page.goto(await latestLinkFor(email, "recovery"));
  await expectLocation(page, "/auth/reset-password");
  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Update password" }).click();
  await expectLocation(page, "/");

  await page.context().clearCookies();
  await page.goto("/auth");
  await signIn(page, email, PASSWORD);
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expectLocation(page, "/auth");

  await signIn(page, email, NEW_PASSWORD);
  await expectLocation(page, "/");
});

test("reused confirm link lands on /auth/error", async ({ page }) => {
  const { confirmLink } = await signUpConfirmed(page);
  await page.context().clearCookies();

  await page.goto(confirmLink);
  await expectPath(page, "/auth/error");
  await expect(page.getByText("This confirmation link is invalid or has expired.")).toBeVisible();
});

test("signed-in /auth redirects to /", async ({ page }) => {
  await signUpConfirmed(page);

  await page.goto("/auth");
  await expectLocation(page, "/");
});
