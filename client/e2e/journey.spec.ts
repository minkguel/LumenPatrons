import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { makeAdmin } from "./admin";
import { EXPECT_TIMEOUT_MS } from "./env";
import {
  currentUserId,
  expectLocation,
  expectPath,
  FULL_NAME,
  PASSWORD,
  signIn,
  signUpConfirmed,
} from "./helpers";

async function signOut(page: Page) {
  await page.getByRole("button", { name: FULL_NAME }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
  await expectPath(page, "/auth");
}

/** Two scraper rows. Titles and links carry a per-run tag so reruns add rather than update. */
function fixture(tag: string) {
  const nextYear = new Date().getUTCFullYear() + 1;
  return [
    {
      title: `E2E Biotech Grant ${tag}`,
      patron_name: "E2E Foundation",
      category: ["Health"],
      description: "Funding for biotech research.",
      estimated_amount: 500000,
      currency: "DKK",
      deadline: `${nextYear}-12-31`,
      external_url: `https://example.com/e2e/biotech-${tag}`,
    },
    {
      title: `E2E Startup Stipend ${tag}`,
      patron_name: "E2E Foundation",
      category: ["Startup"],
      description: "Stipend for early startups.",
      estimated_amount: 100000,
      currency: "DKK",
      deadline: `${nextYear}-12-31`,
      external_url: `https://example.com/e2e/startup-${tag}`,
    },
  ];
}

test("admin imports, user finds, saves, submits, removes", async ({ page }) => {
  const tag = randomUUID().slice(0, 8);
  const biotech = `E2E Biotech Grant ${tag}`;
  const stipend = `E2E Startup Stipend ${tag}`;

  const { email } = await signUpConfirmed(page);
  await makeAdmin(await currentUserId(page));

  // The role lives in the token, so sign out and in to pick it up.
  await signOut(page);
  await signIn(page, email, PASSWORD);
  await expectLocation(page, "/");

  await page.getByRole("link", { name: "Admin" }).click();
  await expectPath(page, "/admin");
  await page.getByLabel("Scraper JSON file").setInputFiles({
    name: "opportunities.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture(tag))),
  });
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText("2 added")).toBeVisible();

  // Discover lists both (the tag keeps leftovers from earlier runs out of the way).
  const search = page.getByRole("search", { name: "Search funding opportunities" });
  await page.getByRole("link", { name: "Discover Patrons" }).click();
  await expectPath(page, "/");
  await search.getByRole("searchbox").fill(tag);
  await search.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("link", { name: biotech })).toBeVisible();
  await expect(page.getByRole("link", { name: stipend })).toBeVisible();

  // Searching "biotech" narrows to the biotech grant.
  await search.getByRole("searchbox").fill(`Biotech Grant ${tag}`);
  await search.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("link", { name: biotech })).toBeVisible();
  await expect(page.getByRole("link", { name: stipend })).toHaveCount(0);

  // Detail page shows the amount in DKK, and Save works.
  await page.getByRole("link", { name: biotech }).click();
  await expect(page.getByRole("heading", { name: biotech })).toBeVisible();
  await expect(page.getByText(/DKK/)).toBeVisible();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toBeVisible();

  // Saved page lists it; mark it Submitted and check it survives a reload.
  await page.getByRole("link", { name: "Saved Patrons" }).click();
  await expectPath(page, "/saved-patrons");
  await expect(page.getByRole("link", { name: biotech })).toBeVisible();
  const status = page.getByLabel(`Status for ${biotech}`);
  await status.selectOption("Submitted");
  await expect(status).toHaveValue("Submitted");
  await expect(status).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel(`Status for ${biotech}`)).toHaveValue("Submitted");

  // Remove (accept the confirm dialog) leaves the empty state.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("No saved patrons yet")).toBeVisible({ timeout: EXPECT_TIMEOUT_MS });
});

test("delete account signs out and blocks sign-in", async ({ page }) => {
  const { email } = await signUpConfirmed(page);

  await page.goto("/settings");
  await page.getByRole("button", { name: "Delete account" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await expectPath(page, "/auth");

  await signIn(page, email, PASSWORD);
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await expectLocation(page, "/auth");
});
