import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

const THEMES = ["system", "light", "dark"] as const;
type Theme = (typeof THEMES)[number];

export const ThemeContext = createContext<{
  theme: Theme;
  computedTheme: Omit<Theme, "system">;
  setTheme: (theme: Theme) => void;
}>({ theme: "system", computedTheme: "light", setTheme: () => {} });

function subscribeToDark(callback: () => void) {
  const mql = window.matchMedia(`(prefers-color-scheme: dark)`);
  mql.addEventListener("change", callback);

  return () => {
    mql.removeEventListener("change", callback);
  };
}

function useSystemTheme() {
  const isDark = useSyncExternalStore(
    subscribeToDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

  return isDark ? "dark" : "light";
}

function subscribeToLocalStorage(callback: () => void) {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
}

function useLocalStorageTheme() {
  const theme = useSyncExternalStore(
    subscribeToLocalStorage,
    () => localStorage.getItem("theme"),
    () => "system",
  );

  if (theme && !THEMES.includes(theme as Theme)) {
    return "system" as const;
  }

  return theme as Theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useSystemTheme();
  const localStorageTheme = useLocalStorageTheme();
  const [theme, setTheme_] = useState<Theme>(localStorageTheme ?? "system");

  const setTheme = useCallback((theme: Theme) => {
    setTheme_(theme);
    localStorage.setItem("theme", theme);
  }, []);

  const computedTheme = useMemo(() => {
    if (theme === "system") {
      return systemTheme;
    }

    return theme;
  }, [theme, systemTheme]);

  const contextValue = useMemo(
    () => ({ theme, computedTheme, setTheme }),
    [theme, computedTheme, setTheme],
  );

  useEffect(() => {
    if (localStorageTheme) {
      setTheme(localStorageTheme);
    }
  }, [localStorageTheme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
