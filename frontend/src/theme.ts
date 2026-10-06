import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  surface: "#0C0E14", onSurface: "#F4F5F7", surfaceSecondary: "#161922", onSurfaceSecondary: "#E2E4EB",
  surfaceTertiary: "#1F232F", onSurfaceTertiary: "#C5C8D4", surfaceInverse: "#FFFFFF", onSurfaceInverse: "#0C0E14", muted: "#94A3B8",
  brand: "#D946EF", onBrand: "#0C0E14", brandPrimary: "#E879F9", onBrandPrimary: "#0C0E14",
  brandSecondary: "#F43F5E", onBrandSecondary: "#FFFFFF", brandTertiary: "rgba(232, 121, 249, 0.15)", onBrandTertiary: "#F4F5F7",
  success: "#10B981", onSuccess: "#FFFFFF", warning: "#F59E0B", onWarning: "#0C0E14", error: "#EF4444", onError: "#FFFFFF",
  info: "#38BDF8", onInfo: "#0C0E14", border: "rgba(255, 255, 255, 0.08)", borderStrong: "rgba(232, 121, 249, 0.4)", divider: "rgba(255, 255, 255, 0.06)",
  overlayGem: "rgba(255, 255, 255, 0.18)",
  gems: {
    ruby: { base: "#E11D48", highlight: "#FDA4AF", shadow: "#881337", icon: "#FFF1F2" },
    emerald: { base: "#10B981", highlight: "#6EE7B7", shadow: "#065F46", icon: "#ECFDF5" },
    sapphire: { base: "#2563EB", highlight: "#93C5FD", shadow: "#1E3A8A", icon: "#EFF6FF" },
    amethyst: { base: "#A855F7", highlight: "#D8B4FE", shadow: "#581C87", icon: "#FAF5FF" },
    topaz: { base: "#F59E0B", highlight: "#FDE68A", shadow: "#92400E", icon: "#FFFBEB" },
    aqua: { base: "#06B6D4", highlight: "#A5F3FC", shadow: "#164E63", icon: "#ECFEFF" },
    coral: { base: "#F97316", highlight: "#FED7AA", shadow: "#9A3412", icon: "#FFF7ED" },
  },
};

export type ThemeColors = typeof dark;
export const defaultScheme = "dark" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark: ThemeColors } = { light: dark, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme(null);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system === "light" ? "light" : "dark";
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