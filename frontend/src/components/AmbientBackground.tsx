import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/src/theme";

/**
 * Multi-layer ambient background giving the dark surface a sense of depth
 * with soft colored lights near the top and bottom edges. Purely decorative.
 */
export function AmbientBackground() {
  const { colors } = useTheme();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Deep base */}
      <LinearGradient
        colors={[colors.surface, "#0A0912", colors.surface]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top-left magenta light */}
      <LinearGradient
        colors={["rgba(232, 121, 249, 0.22)", "rgba(232, 121, 249, 0.06)", "transparent"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.6 }}
        style={[styles.light, { top: -140, left: -80, width: 420, height: 420 }]}
      />
      {/* Bottom-right rose light */}
      <LinearGradient
        colors={["transparent", "rgba(244, 63, 94, 0.14)", "rgba(244, 63, 94, 0.02)"]}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.light, { bottom: -180, right: -100, width: 460, height: 460 }]}
      />
      {/* Soft center wash */}
      <LinearGradient
        colors={["rgba(56, 189, 248, 0.08)", "transparent"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.light, { top: "35%", left: "15%", width: 300, height: 260 }]}
      />
      {/* Vignette darkening on edges */}
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent", "transparent", "rgba(0,0,0,0.55)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  light: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.9,
  },
});
