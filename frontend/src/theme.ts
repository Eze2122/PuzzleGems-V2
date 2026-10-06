import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

// Puzzle Gems — 3D pastel fantasy palette (from UI_REFERENCIA_PUZZLE_GEMS.png).
const light = {
  surface: "#E9E1FF", onSurface: "#3A2470", surfaceSecondary: "rgba(255, 255, 255, 0.82)", onSurfaceSecondary: "#4A3889",
  surfaceTertiary: "#F4EFFF", onSurfaceTertiary: "#6B5BA5", surfaceInverse: "#FFFFFF", onSurfaceInverse: "#3A2470", muted: "#7E72AE",
  brand: "#6D3FF0", onBrand: "#FFFFFF", brandPrimary: "#8B5CF6", onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF5FA2", onBrandSecondary: "#FFFFFF", brandTertiary: "rgba(139, 92, 246, 0.14)", onBrandTertiary: "#3A2470",
  success: "#22C55E", onSuccess: "#FFFFFF", warning: "#FFB020", onWarning: "#5A3300", error: "#F43F5E", onError: "#FFFFFF",
  info: "#38BDF8", onInfo: "#0B2A4A", border: "rgba(255, 255, 255, 0.92)", borderStrong: "rgba(124, 77, 255, 0.45)", divider: "rgba(124, 77, 255, 0.16)",
  overlayGem: "rgba(255, 255, 255, 0.5)",
  // extra game tokens
  brandDeep: "#4C1D95", successDeep: "#15803D", gold: "#FFC93C", goldDeep: "#F59E0B", heart: "#FF4D7E",
  backdrop: "rgba(38, 18, 92, 0.55)", glass: "rgba(255, 255, 255, 0.38)", glassEdge: "rgba(255, 255, 255, 0.95)",
  track: "#2B1B5E", locked: "#A9A3C9", lockedDeep: "#7C76A3", textOnColor: "#FFFFFF", textShadow: "rgba(60, 20, 120, 0.55)",
  tiles: [
    { top: "#34E0C8", base: "#14B8A6", deep: "#0F766E" },
    { top: "#5AA2FF", base: "#3B82F6", deep: "#1D4ED8" },
    { top: "#C084FC", base: "#A855F7", deep: "#7E22CE" },
    { top: "#FF7AC6", base: "#EC4899", deep: "#BE185D" },
    { top: "#FFD25A", base: "#F5B014", deep: "#C27803" },
    { top: "#6EDBFF", base: "#22B5F0", deep: "#0284C7" },
  ],
  gems: {
    ruby: { base: "#F0315A", highlight: "#FFB3C4", shadow: "#9F1239", icon: "#FFF1F2" },
    emerald: { base: "#22C97A", highlight: "#A7F3D0", shadow: "#047857", icon: "#ECFDF5" },
    sapphire: { base: "#3B6CF6", highlight: "#BFD4FF", shadow: "#1E3A8A", icon: "#EFF6FF" },
    amethyst: { base: "#A855F7", highlight: "#E9D5FF", shadow: "#6B21A8", icon: "#FAF5FF" },
    topaz: { base: "#FFC21A", highlight: "#FFF1A8", shadow: "#C26A00", icon: "#FFFBEB" },
    aqua: { base: "#1CC8E8", highlight: "#B5F5FF", shadow: "#0E7490", icon: "#ECFEFF" },
    coral: { base: "#FF7A2F", highlight: "#FFD3B0", shadow: "#B4410C", icon: "#FFF7ED" },
    rose: { base: "#FF5FB8", highlight: "#FFD0EC", shadow: "#B0186F", icon: "#FFF0F8" },
    lime: { base: "#9BDB2E", highlight: "#E4FBB0", shadow: "#4D7C0F", icon: "#F7FEE7" },
    moon: { base: "#C9CFEA", highlight: "#FFFFFF", shadow: "#6E77A8", icon: "#FFFFFF" },
  },
};

export type ThemeColors = typeof light;
export const defaultScheme = "light" satisfies ColorScheme;
// The game uses a single bright palette in both system modes.
export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark: light };
export const colors = light;

export const fonts = {
  display: "LilitaOne",
  bold: "Fredoka-Bold",
  semibold: "Fredoka-SemiBold",
  medium: "Fredoka-Medium",
};

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme(null);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "dark" ? "dark" : "light";
  return { scheme, colors: themes[scheme] };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
