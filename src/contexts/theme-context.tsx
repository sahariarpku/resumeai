"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "mid" | "white" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "mid",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("mid");

  useEffect(() => {
    const stored = localStorage.getItem("app-theme") as Theme | null;
    if (stored === "white" || stored === "dark" || stored === "mid") {
      applyTheme(stored);
      setThemeState(stored);
    }
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem("app-theme", t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(t: Theme) {
  const el = document.documentElement;
  el.classList.remove("theme-mid", "theme-white", "theme-dark");
  el.classList.add(`theme-${t}`);
}

export function useTheme() {
  return useContext(ThemeContext);
}
