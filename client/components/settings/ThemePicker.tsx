"use client";

import { useSyncExternalStore } from "react";
import { getStoredTheme, setTheme, subscribeTheme, themeOptions } from "@/lib/theme";

const labels = { light: "Light", dark: "Dark", system: "System" };

export function ThemePicker() {
  const selected = useSyncExternalStore(subscribeTheme, getStoredTheme, () => "system");

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="inline-flex gap-1 rounded-lg bg-sunken p-1">
        {themeOptions.map((option) => (
          <label
            key={option}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-lumen-teal ${
              selected === option
                ? "bg-lumen-teal text-on-primary"
                : "text-foreground/60 hover:text-lumen-teal"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={option}
              checked={selected === option}
              onChange={() => setTheme(option)}
              className="sr-only"
            />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
