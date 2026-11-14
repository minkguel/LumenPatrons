import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStoredTheme, parseTheme, setTheme, subscribeTheme, themeScript } from "./theme";

function fakeBrowser(saved: Record<string, string> = {}) {
  const store = new Map(Object.entries(saved));
  const attributes = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  });
  vi.stubGlobal("document", {
    documentElement: {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
    },
  });
  return { store, attributes };
}

describe("parseTheme", () => {
  it("keeps light and dark", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("falls back to system for anything else", () => {
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme("purple")).toBe("system");
  });
});

describe("setTheme", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("saves and applies dark", () => {
    const { attributes } = fakeBrowser();
    setTheme("dark");
    expect(getStoredTheme()).toBe("dark");
    expect(attributes.get("data-theme")).toBe("dark");
  });

  it("clears both when going back to system", () => {
    const { store, attributes } = fakeBrowser();
    setTheme("dark");
    setTheme("system");
    expect(store.size).toBe(0);
    expect(attributes.has("data-theme")).toBe(false);
  });

  it("still applies the theme when storage is blocked", () => {
    const { attributes } = fakeBrowser();
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("blocked");
      },
      getItem: () => {
        throw new Error("blocked");
      },
    });
    setTheme("dark");
    expect(attributes.get("data-theme")).toBe("dark");
    expect(getStoredTheme()).toBe("system");
  });

  it("tells subscribers, and stops after unsubscribing", () => {
    fakeBrowser();
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    setTheme("light");
    unsubscribe();
    setTheme("dark");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("themeScript", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("applies a theme saved by setTheme", () => {
    const { attributes } = fakeBrowser();
    setTheme("dark");
    attributes.clear();
    new Function(themeScript)();
    expect(attributes.get("data-theme")).toBe("dark");
  });

  it("sets nothing when no theme is saved", () => {
    const { attributes } = fakeBrowser();
    new Function(themeScript)();
    expect(attributes.has("data-theme")).toBe(false);
  });
});
