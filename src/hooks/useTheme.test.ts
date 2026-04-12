import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useTheme } from "./useTheme";

type Listener = (event: MediaQueryListEvent) => void;

function installMatchMedia(matchesDark: boolean) {
  const listeners: Listener[] = [];
  (window as unknown as { matchMedia: typeof window.matchMedia }).matchMedia = (
    query: string,
  ) =>
    ({
      matches: query.includes("dark") ? matchesDark : false,
      media: query,
      onchange: null,
      addEventListener: (_type: string, cb: Listener) => {
        listeners.push(cb);
      },
      removeEventListener: (_type: string, cb: Listener) => {
        const idx = listeners.indexOf(cb);
        if (idx >= 0) listeners.splice(idx, 1);
      },
      dispatchEvent: () => true,
      addListener: () => undefined,
      removeListener: () => undefined,
    }) as unknown as MediaQueryList;
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    installMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  test("returns 'system' when no stored value exists", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
  });

  test("returns stored 'dark' theme when localStorage has it", () => {
    window.localStorage.setItem("qaf-theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  test("setTheme('dark') updates data-theme and localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("qaf-theme")).toBe("dark");
  });

  test("setTheme('system') removes data-theme and localStorage key", () => {
    window.localStorage.setItem("qaf-theme", "dark");
    document.documentElement.dataset.theme = "dark";
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("system"));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(window.localStorage.getItem("qaf-theme")).toBeNull();
  });

  test("resolvedTheme is 'dark' when system prefers dark", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("dark");
  });
});
