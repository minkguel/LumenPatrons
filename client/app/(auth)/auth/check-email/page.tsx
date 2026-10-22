import { Suspense } from "react";
import { CheckEmail } from "@/components/auth/CheckEmail";

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-white border border-lumen-teal/15 rounded-xl p-6 shadow-sm text-center text-foreground/55">
          Loading...
        </div>
      }
    >
      <CheckEmail />
    </Suspense>
  );
}
