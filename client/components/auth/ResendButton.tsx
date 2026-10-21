"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { resendConfirmation } from "@/lib/auth";
import { toAuthMessage } from "@/lib/auth/messages";

const COOLDOWN_SECONDS = 60;

export function ResendButton({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleClick() {
    setSending(true);
    setMessage(null);
    try {
      await resendConfirmation(email);
      setMessage({ text: "Confirmation email sent.", isError: false });
    } catch (error) {
      setMessage({ text: toAuthMessage(error), isError: true });
    } finally {
      setSending(false);
      setSecondsLeft(COOLDOWN_SECONDS);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleClick}
        disabled={sending || secondsLeft > 0 || !email}
      >
        {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend confirmation email"}
      </Button>
      {message && (
        <p
          role="status"
          className={`text-sm px-3 py-2 rounded-lg ${
            message.isError ? "text-red-500 bg-red-50" : "text-green-600 bg-green-50"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
