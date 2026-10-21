"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

type AuthTab = "signin" | "signup";

export function AuthForm() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<AuthTab>(initialTab);

  return (
    <div className="w-full max-w-md">
      <div className="flex rounded-lg border border-lumen-teal/20 overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setTab("signin")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === "signin"
              ? "bg-lumen-teal text-white"
              : "bg-white text-foreground/60 hover:text-lumen-teal"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === "signup"
              ? "bg-lumen-teal text-white"
              : "bg-white text-foreground/60 hover:text-lumen-teal"
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm">
        {tab === "signin" ? <SignInForm /> : <SignUpForm />}
      </div>
    </div>
  );
}
