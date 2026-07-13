import { Platform } from "react-native";

export const BRAND = {
  gradient: ["#220f8f", "#0fd1c7"] as [string, string],
  indigo: "#220f8f",
  teal: "#0fd1c7",
};

export type ThemeMode = "light" | "dark";

export const palettes = {
  light: {
    background: "#F7F7FA",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    textPrimary: "#0D082A",
    textSecondary: "#5C5877",
    textMuted: "#8F89B5",
    border: "rgba(34, 15, 143, 0.08)",
    tabBar: "rgba(255, 255, 255, 0.92)",
    scrim: "rgba(13, 8, 42, 0.6)",
    danger: "#E5484D",
    success: "#0EA672",
  },
  dark: {
    background: "#050314",
    surface: "#120A31",
    surfaceElevated: "#1A0F45",
    textPrimary: "#FFFFFF",
    textSecondary: "#BEBAD6",
    textMuted: "#8F89B5",
    border: "rgba(15, 209, 199, 0.15)",
    tabBar: "rgba(18, 10, 49, 0.92)",
    scrim: "rgba(0, 0, 0, 0.7)",
    danger: "#FF6369",
    success: "#3FD9A3",
  },
};

export type ThemeColors = typeof palettes.light;

export const shadows = {
  light: {
    shadowColor: "#220f8f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  dark: {
    shadowColor: "#0fd1c7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
};

// Verdana is a system font on iOS/macOS/Windows; Android usually falls back gracefully.
export const FONT = Platform.select({
  ios: "Verdana",
  android: "Verdana",
  default: "Verdana",
}) as string;

export const fonts = {
  regular: FONT,
  heading: FONT,
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const space = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64];
