import { Ionicons } from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { ComponentProps, ReactNode, useCallback, useRef, useState } from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { colors, fonts } from "@/src/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

const VARIANTS = {
  green: { face: ["#5BE58A", "#22C55E"], deep: colors.successDeep, text: colors.textOnColor },
  purple: { face: ["#A98BFF", "#7C4DFF"], deep: colors.brandDeep, text: colors.textOnColor },
  gold: { face: ["#FFE07A", "#FFB020"], deep: "#C27803", text: colors.onWarning },
  white: { face: ["#FFFFFF", "#F1EAFF"], deep: "#C9B8F5", text: colors.brand },
  pink: { face: ["#FF8CC6", "#EC4899"], deep: "#BE185D", text: colors.textOnColor },
} as const;
export type ButtonVariant = keyof typeof VARIANTS;

type GameButtonProps = {
  testID: string;
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  size?: "lg" | "md" | "sm";
  disabled?: boolean;
  badge?: number;
  style?: StyleProp<ViewStyle>;
};

/** Candy-style 3D button: glossy face + darker base that compresses on press. */
export function GameButton({ testID, label, onPress, variant = "purple", icon, iconRight, size = "md", disabled, badge, style }: GameButtonProps) {
  const v = VARIANTS[variant];
  const h = size === "lg" ? 60 : size === "md" ? 52 : 44;
  const fs = size === "lg" ? 22 : size === "md" ? 18 : 15;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[{ height: h + 6 }, disabled && styles.disabled, style]}
    >
      {({ pressed }) => (
        <>
          <View style={[styles.deep, { backgroundColor: v.deep, borderRadius: h / 2 }]} />
          <View style={[styles.face, { height: h, borderRadius: h / 2, transform: [{ translateY: pressed ? 4 : 0 }] }]}>
            <LinearGradient colors={v.face as unknown as [string, string]} style={StyleSheet.absoluteFill} />
            <View style={[styles.gloss, { borderRadius: h / 2 }]} />
            {icon && <Ionicons name={icon} size={fs + 2} color={v.text} />}
            <Text style={[styles.label, { fontSize: fs, color: v.text }]} numberOfLines={1}>{label}</Text>
            {iconRight && <Ionicons name={iconRight} size={fs + 2} color={v.text} />}
            {badge !== undefined && badge > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text></View>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

/** Round 3D icon button (back, settings, close). */
export function IconButton({ testID, icon, onPress, label, size = 46, variant = "purple" }: {
  testID: string; icon: IconName; onPress: () => void; label: string; size?: number; variant?: ButtonVariant;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={{ width: size, height: size + 4 }}>
      {({ pressed }) => (
        <>
          <View style={[styles.deep, { backgroundColor: v.deep, borderRadius: size / 2 }]} />
          <View style={[styles.face, { height: size, borderRadius: size / 2, paddingHorizontal: 0, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
            <LinearGradient colors={v.face as unknown as [string, string]} style={StyleSheet.absoluteFill} />
            <View style={[styles.gloss, { borderRadius: size / 2 }]} />
            <Ionicons name={icon} size={size * 0.48} color={v.text} />
          </View>
        </>
      )}
    </Pressable>
  );
}

/** Frosted white card. */
export function Panel({ children, style, testID }: { children: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  return <View testID={testID} style={[styles.panel, style]}>{children}</View>;
}

export function StarRow({ count, size = 18, testID }: { count: number; size?: number; testID?: string }) {
  return (
    <View testID={testID} style={styles.starRow}>
      {[1, 2, 3].map((s) => (
        <Ionicons key={s} name="star" size={size} color={s <= count ? colors.gold : "rgba(124,77,255,0.2)"} style={styles.starShadow} />
      ))}
    </View>
  );
}

/** Lightweight in-app toast (no system alerts). */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), 2600);
  }, []);
  const node = message ? (
    <Animated.View entering={FadeInDown} exiting={FadeOutUp} pointerEvents="none" style={styles.toastWrap}>
      <View testID="toast-message" style={styles.toast}><Text style={styles.toastText}>{message}</Text></View>
    </Animated.View>
  ) : null;
  return { toast: node, showToast: show };
}

export const text = StyleSheet.create({
  display: {
    fontFamily: fonts.display, color: colors.textOnColor,
    textShadowColor: colors.brandDeep, textShadowRadius: 4, textShadowOffset: { width: 0, height: 3 },
  },
  title: { fontFamily: fonts.bold, color: colors.onSurface },
  body: { fontFamily: fonts.medium, color: colors.onSurfaceSecondary },
  kicker: { fontFamily: fonts.bold, color: colors.brandSecondary, letterSpacing: 1.6, fontSize: 12 },
});

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
  deep: { position: "absolute", left: 0, right: 0, top: 6, bottom: 0 },
  face: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingHorizontal: 20, overflow: "hidden",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.7)",
  },
  gloss: { position: "absolute", top: 3, left: 10, right: 10, height: "42%", backgroundColor: "rgba(255,255,255,0.35)" },
  label: { fontFamily: fonts.bold },
  badge: {
    minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 6, marginLeft: 2,
    backgroundColor: colors.brandSecondary, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.surfaceInverse,
  },
  badgeText: { color: colors.textOnColor, fontFamily: fonts.bold, fontSize: 12 },
  panel: {
    backgroundColor: colors.surfaceSecondary, borderRadius: 28, padding: 16,
    borderWidth: 2, borderColor: colors.border,
    shadowColor: colors.brandDeep, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  starRow: { flexDirection: "row", gap: 2 },
  starShadow: { textShadowColor: "rgba(194,120,3,0.6)", textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  toastWrap: { position: "absolute", top: 64, left: 24, right: 24, alignItems: "center" },
  toast: {
    backgroundColor: colors.brandDeep, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
  },
  toastText: { color: colors.textOnColor, fontFamily: fonts.semibold, fontSize: 14, textAlign: "center" },
});
