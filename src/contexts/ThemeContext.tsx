import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StatusBar } from "expo-status-bar";
import { storage } from "@/src/utils/storage";
import { palettes, shadows, ThemeColors, ThemeMode } from "@/src/theme";

const KEY = "docvault.themeMode";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  shadow: (typeof shadows)["light"];
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<string>(KEY, "light");
      if (stored === "dark" || stored === "light") setModeState(stored);
      setHydrated(true);
    })();
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    storage.setItem(KEY, m);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      colors: palettes[mode],
      shadow: shadows[mode],
      toggle: () => setMode(mode === "light" ? "dark" : "light"),
      setMode,
    }),
    [mode],
  );

  if (!hydrated) return null;

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
