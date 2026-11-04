"use client";

import { themeScript } from "@/lib/theme";

// The type swap stops React warning about script tags when it renders on the client.
// See node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
