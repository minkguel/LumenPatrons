import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm text-center text-foreground/55">
          Loading...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
