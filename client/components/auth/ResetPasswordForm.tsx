"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updatePassword } from "@/lib/auth";
import { toAuthMessage } from "@/lib/auth/messages";
import { validateNewPassword } from "@/lib/auth/validation";

export function ResetPasswordForm() {
  const router = useRouter();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    const validationError = validateNewPassword(form.password, form.confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      await updatePassword(form.password);
      router.replace("/");
      router.refresh();
    } catch (authError) {
      setError(toAuthMessage(authError));
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm">
      <h1 className="text-xl font-semibold mb-4">Choose a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
