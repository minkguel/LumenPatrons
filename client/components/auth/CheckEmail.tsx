"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResendButton } from "@/components/auth/ResendButton";

export function CheckEmail() {
  const email = useSearchParams().get("email") ?? "";

  return (
    <div className="w-full max-w-md bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm space-y-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">Check your inbox</h1>
      {email && (
        <p className="text-sm text-foreground/65">
          We sent a confirmation link to {email}.
        </p>
      )}
      <ResendButton email={email} />
      <p className="text-sm">
        <Link href="/auth" className="text-lumen-teal hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
