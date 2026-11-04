export const themeOptions = ["light", "dark", "system"] as const;
export type Theme = (typeof themeOptions)[number];

const STORAGE_KEY = "lumen-theme";

export function parseTheme(value: string | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

// Runs before the first paint, so a saved theme never flashes the wrong colours.
// "system" sets nothing: globals.css then follows the OS setting.
export const themeScript = `try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStoredTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "system"; // storage can be blocked, e.g. in private browsing
  }
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not saved, but the theme still applies until the page reloads.
  }

  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);

  listeners.forEach((listener) => listener());
}
