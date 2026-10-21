"use client";

import { isAuthApiError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toAuthMessage } from "@/lib/auth/messages";
import { normalizeEmail, validateSignUp } from "@/lib/auth/validation";
import { userTypeOptions } from "@/lib/mock/user";
import { useAuth } from "@/providers/AuthProvider";

export function SignUpForm() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    userType: userTypeOptions[0],
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToCheckEmail() {
    router.push("/auth/check-email?email=" + encodeURIComponent(normalizeEmail(form.email)));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    const validationError = validateSignUp(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    try {
      await signUp(form);
      goToCheckEmail();
    } catch (authError) {
      if (isAuthApiError(authError) && authError.code === "user_already_exists") {
        goToCheckEmail();
        return;
      }
      setError(toAuthMessage(authError));
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        type="text"
        placeholder="Jane Founder"
        value={form.fullName}
        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
      />
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
      <Select
        label="I am a..."
        value={form.userType}
        onChange={(e) => setForm({ ...form, userType: e.target.value })}
        options={userTypeOptions.map((type) => ({ value: type, label: type }))}
      />
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
