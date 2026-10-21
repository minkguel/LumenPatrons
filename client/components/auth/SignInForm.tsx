"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ResendButton } from "@/components/auth/ResendButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isEmailNotConfirmed, toAuthMessage } from "@/lib/auth/messages";
import { safeRedirect } from "@/lib/auth/redirects";
import { normalizeEmail, validateEmailPassword } from "@/lib/auth/validation";
import { useAuth } from "@/providers/AuthProvider";

export function SignInForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setNeedsConfirmation(false);

    const validationError = validateEmailPassword(form.email, form.password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      await signIn(form.email, form.password);
      router.replace(safeRedirect(searchParams.get("next")));
      router.refresh();
    } catch (authError) {
      setError(toAuthMessage(authError));
      setNeedsConfirmation(isEmailNotConfirmed(authError));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {searchParams.get("reason") === "expired" && (
        <p role="status" className="text-sm text-foreground/70 bg-lumen-teal/5 px-3 py-2 rounded-lg">
          Your session expired. Please sign in again.
        </p>
      )}
      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <p className="text-xs text-foreground/45">
        <Link href="/auth/forgot-password" className="text-lumen-teal hover:underline">
          Forgot password?
        </Link>
      </p>
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      {needsConfirmation && <ResendButton email={normalizeEmail(form.email)} />}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
