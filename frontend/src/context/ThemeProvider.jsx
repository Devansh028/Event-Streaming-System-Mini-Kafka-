import { useLayoutEffect, useState } from "react";
import { ThemeContext } from "./themeContext";

const STORAGE_KEY = "eventstream-theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" ? "light" : "dark";
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    root.style.setProperty("--body-bg", theme === "light" ? "#f1f5f9" : "#0b1120");
  }, [theme]);

  const setTheme = (next) => setThemeState(next === "light" ? "light" : "dark");

  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
