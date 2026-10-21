"use client";

import { isAuthApiError } from "@supabase/supabase-js";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/auth";
import { toAuthMessage } from "@/lib/auth/messages";
import { validateEmail } from "@/lib/auth/validation";

const SENT = "If an account exists for that email, we've sent a reset link.";
const RATE_LIMIT_CODES = ["over_email_send_rate_limit", "over_request_rate_limit"];

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setSent(false);

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (authError) {
      if (isAuthApiError(authError) && authError.code && RATE_LIMIT_CODES.includes(authError.code)) {
        setError(toAuthMessage(authError));
      } else {
        // Do not reveal whether an account exists.
        setSent(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Reset your password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {sent && (
          <p role="status" className="text-sm text-foreground/70 bg-lumen-teal/5 px-3 py-2 rounded-lg">
            {SENT}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-xs text-foreground/45">
          <Link href="/auth" className="text-lumen-teal hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
