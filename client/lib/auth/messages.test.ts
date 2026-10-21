import { describe, expect, it } from "vitest";
import { AuthApiError } from "@supabase/supabase-js";
import { isEmailNotConfirmed, isRateLimited, toAuthMessage } from "./messages";

const GENERIC = "Something went wrong. Please try again.";

describe("toAuthMessage", () => {
  it.each([
    ["invalid_credentials", "Email or password is incorrect."],
    ["email_not_confirmed", "Please confirm your email first."],
    ["weak_password", "Password must be at least 8 characters."],
    ["same_password", "Your new password must be different from your current password."],
    ["over_email_send_rate_limit", "Too many attempts. Please wait a minute and try again."],
    ["over_request_rate_limit", "Too many attempts. Please wait a minute and try again."],
    ["something_new", GENERIC],
  ])("maps %s", (code, msg) => expect(toAuthMessage(new AuthApiError("x", 400, code))).toBe(msg));

  it("maps plain Error to generic", () => expect(toAuthMessage(new Error("boom"))).toBe(GENERIC));
});

describe("isEmailNotConfirmed", () => {
  it("detects email_not_confirmed", () =>
    expect(isEmailNotConfirmed(new AuthApiError("x", 400, "email_not_confirmed"))).toBe(true));
  it("false for other errors", () => expect(isEmailNotConfirmed(new Error("x"))).toBe(false));
});

describe("isRateLimited", () => {
  it.each(["over_email_send_rate_limit", "over_request_rate_limit"])("true for %s", (code) =>
    expect(isRateLimited(new AuthApiError("x", 429, code))).toBe(true));
  it("false for other auth errors", () =>
    expect(isRateLimited(new AuthApiError("x", 400, "invalid_credentials"))).toBe(false));
  it("false for non-auth errors", () => expect(isRateLimited(new Error("x"))).toBe(false));
});
