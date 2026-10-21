import type { SignUpInput } from "@/lib/auth";

export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FILL_ALL = "Please fill in all fields.";
const INVALID_EMAIL = "Please enter a valid email address.";
const SHORT_PASSWORD = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return FILL_ALL;
  if (!EMAIL_PATTERN.test(normalized)) return INVALID_EMAIL;
  return null;
}

export function validateEmailPassword(email: string, password: string): string | null {
  const normalized = normalizeEmail(email);
  if (!normalized || !password) return FILL_ALL;
  if (!EMAIL_PATTERN.test(normalized)) return INVALID_EMAIL;
  if (password.length < MIN_PASSWORD_LENGTH) return SHORT_PASSWORD;
  return null;
}

export function validateSignUp(input: SignUpInput): string | null {
  if (!input.fullName.trim() || !input.userType.trim()) return FILL_ALL;
  return validateEmailPassword(input.email, input.password);
}

export function validateNewPassword(password: string, confirm: string): string | null {
  if (!password || !confirm) return FILL_ALL;
  if (password.length < MIN_PASSWORD_LENGTH) return SHORT_PASSWORD;
  if (password !== confirm) return "Passwords do not match.";
  return null;
}
