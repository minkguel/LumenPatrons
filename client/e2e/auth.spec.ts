import { expect, test } from "@playwright/test";
import { API_URL } from "./env";
import {
  accessToken,
  expectLocation,
  expectPath,
  FULL_NAME,
  NEW_PASSWORD,
  PASSWORD,
  signIn,
  signUp,
  signUpConfirmed,
  uniqueEmail,
} from "./helpers";
import { latestLinkFor } from "./mailpit";

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

  await page.goto("/saved-patrons?status=draft");
  await expectLocation(page, /^\/auth\?.*next=/);

  await signIn(page, email, PASSWORD);
  await expectLocation(page, "/saved-patrons?status=draft");
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
