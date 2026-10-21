"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ResendButton } from "@/components/auth/ResendButton";
import { Input } from "@/components/ui/Input";
import { normalizeEmail } from "@/lib/auth/validation";

export function AuthLinkError() {
  const isRecovery = useSearchParams().get("type") === "recovery";
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-md bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm space-y-4">
      {isRecovery ? (
        <>
          <h1 className="text-lg font-semibold text-foreground">
            This reset link is invalid or has expired.
          </h1>
          <Link
            href="/auth/forgot-password"
            className="block text-sm font-medium text-lumen-teal hover:underline"
          >
            Request a new reset link
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold text-foreground">
            This confirmation link is invalid or has expired.
          </h1>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <ResendButton email={normalizeEmail(email)} />
        </>
      )}
      <Link href="/auth" className="block text-sm text-foreground/60 hover:text-lumen-teal">
        Back to sign in
      </Link>
    </div>
  );
}
