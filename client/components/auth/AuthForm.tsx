"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { userTypeOptions } from "@/lib/mock/user";
import { useAuth } from "@/providers/AuthProvider";

type AuthTab = "signin" | "signup";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function AuthForm() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn, signUp, isLoading } = useAuth();
  const router = useRouter();

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    email: "",
    password: "",
    userType: userTypeOptions[0],
  });

  async function handleSignIn(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!signInForm.email || !signInForm.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isValidEmail(signInForm.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (signInForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    await signIn(signInForm.email, signInForm.password);
    setSuccess(true);
    router.push("/");
  }

  async function handleSignUp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (
      !signUpForm.fullName ||
      !signUpForm.email ||
      !signUpForm.password ||
      !signUpForm.userType
    ) {
      setError("Please fill in all fields.");
      return;
    }
    if (!isValidEmail(signUpForm.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (signUpForm.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    await signUp(signUpForm);
    setSuccess(true);
    router.push("/");
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex rounded-lg border border-lumen-teal/20 overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => {
            setTab("signin");
            setError(null);
          }}
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
          onClick={() => {
            setTab("signup");
            setError(null);
          }}
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
        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={signInForm.email}
              onChange={(e) =>
                setSignInForm({ ...signInForm, email: e.target.value })
              }
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={signInForm.password}
              onChange={(e) =>
                setSignInForm({ ...signInForm, password: e.target.value })
              }
            />
            <p className="text-xs text-foreground/45">
              Forgot password?{" "}
              <span className="text-lumen-teal/60">Coming soon</span>
            </p>
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                Signed in successfully!
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Jane Founder"
              value={signUpForm.fullName}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, fullName: e.target.value })
              }
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={signUpForm.email}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, email: e.target.value })
              }
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={signUpForm.password}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, password: e.target.value })
              }
            />
            <Select
              label="I am a..."
              value={signUpForm.userType}
              onChange={(e) =>
                setSignUpForm({ ...signUpForm, userType: e.target.value })
              }
              options={userTypeOptions.map((type) => ({
                value: type,
                label: type,
              }))}
            />
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                Account created successfully!
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
