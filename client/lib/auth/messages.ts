import { isAuthApiError } from "@supabase/supabase-js";

const GENERIC = "Something went wrong. Please try again.";
const RATE_LIMIT = "Too many attempts. Please wait a minute and try again.";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  email_not_confirmed: "Please confirm your email first.",
  weak_password: "Password must be at least 8 characters.",
  over_email_send_rate_limit: RATE_LIMIT,
  over_request_rate_limit: RATE_LIMIT,
};

function errorCode(error: unknown): string | undefined {
  return isAuthApiError(error) ? (error.code ?? undefined) : undefined;
}

export function toAuthMessage(error: unknown): string {
  const code = errorCode(error);
  if (code && code in MESSAGES) return MESSAGES[code];
  console.error("Unmapped auth error:", error);
  return GENERIC;
}

export function isEmailNotConfirmed(error: unknown): boolean {
  return errorCode(error) === "email_not_confirmed";
}
