"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "agent_society_theme";
const CHANGE_EVENT = "agent-society-theme-changed";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

function normalize(value) {
  return value === "light" || value === "dark" ? value : null;
}

function readStored() {
  try {
    return normalize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStored(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode) — cookie still keeps SSR in sync
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeProvider({ initialTheme = "light", children }) {
  const fallback = initialTheme === "dark" ? "dark" : "light";

  const theme = useSyncExternalStore(
    subscribe,
    () => readStored() || fallback,
    () => fallback
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.cookie = `agent_society_theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    writeStored(normalize(nextTheme) || "light");
  }, []);

  const toggleTheme = useCallback(() => {
    writeStored(theme === "dark" ? "light" : "dark");
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
