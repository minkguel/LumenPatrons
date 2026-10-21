import { describe, expect, it } from "vitest";
import {
  normalizeEmail,
  validateEmailPassword,
  validateNewPassword,
  validateSignUp,
} from "./validation";

describe("validation", () => {
  it("normalizes email", () => expect(normalizeEmail("  Jane@Example.COM ")).toBe("jane@example.com"));
  it("accepts normalized-valid email", () =>
    expect(validateEmailPassword(" Jane@Example.com ", "12345678")).toBeNull());
  it("rejects 7-char password", () =>
    expect(validateEmailPassword("a@b.co", "1234567")).toBe("Password must be at least 8 characters."));
  it("rejects bad email", () =>
    expect(validateEmailPassword("a@b", "12345678")).toBe("Please enter a valid email address."));
  it("rejects empty", () => expect(validateEmailPassword("", "")).toBe("Please fill in all fields."));
  it("rejects mismatched new password", () =>
    expect(validateNewPassword("12345678", "12345679")).toBe("Passwords do not match."));
  it("rejects short new password", () =>
    expect(validateNewPassword("123", "123")).toBe("Password must be at least 8 characters."));
  it("accepts matching new password", () => expect(validateNewPassword("12345678", "12345678")).toBeNull());
  it("requires all sign-up fields", () =>
    expect(validateSignUp({ fullName: " ", email: "a@b.co", password: "12345678", userType: "Founder" })).toBe(
      "Please fill in all fields.",
    ));
  it("accepts valid sign-up", () =>
    expect(validateSignUp({ fullName: "Jane", email: "a@b.co", password: "12345678", userType: "Founder" })).toBeNull());
});
