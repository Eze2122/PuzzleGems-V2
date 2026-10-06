import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet, View } from "react-native";
import { useEffect } from "react";

import { GemColor } from "@/src/game/levels";
import { makeStyles, useTheme } from "@/src/theme";

type GemProps = { color: GemColor; selected?: boolean; size?: number };

const GEM_ICON: Record<GemColor, keyof typeof Ionicons.glyphMap> = {
  ruby: "diamond",
  emerald: "diamond-outline",
  sapphire: "sparkles",
  amethyst: "star",
  topaz: "flash",
  aqua: "water",
  coral: "flame",
};

/**
 * 3D gem with multi-layer facets. Selection shows a subtle light reflection
 * sliding across the surface plus a slight brightness lift. No cross/star
 * burst effects.
 */
export function Gem({ color, selected = false, size = 42 }: GemProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const palette = colors.gems[color];

  const lift = useSharedValue(0);
  const float = useSharedValue(0);
  const entrance = useSharedValue(0);
  const shineX = useSharedValue(0); // -1 → 1 across the gem
  const brightness = useSharedValue(0); // extra highlight when selected

  // Entrance scale-in (no burst)
  useEffect(() => {
    entrance.value = withSpring(1, { damping: 12, stiffness: 190, mass: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selection: lift + idle float + sliding shine + brightness lift
  useEffect(() => {
    lift.value = withSpring(selected ? -10 : 0, { damping: 15, stiffness: 190 });
    if (selected) {
      float.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
      brightness.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) });
      // Reflection sweeps across the surface and softly returns
      shineX.value = -1;
      shineX.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.cubic) }),
          withTiming(-1, { duration: 0 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(float);
      cancelAnimation(shineX);
      float.value = withTiming(0, { duration: 180 });
      brightness.value = withTiming(0, { duration: 240 });
      shineX.value = withTiming(-1, { duration: 180 });
    }
  }, [lift, float, shineX, brightness, selected]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value + float.value },
      { scale: 0.65 + 0.35 * entrance.value },
    ],
    opacity: entrance.value,
  }));

  const brightnessStyle = useAnimatedStyle(() => ({ opacity: brightness.value * 0.22 }));

  const shineStyle = useAnimatedStyle(() => {
    // Fade in near the center of the sweep, fade out at the edges
    const t = shineX.value;
    const fade = Math.max(0, 1 - Math.abs(t) * 1.1);
    return {
      opacity: fade * 0.55,
      transform: [{ translateX: t * size * 0.5 }, { rotate: "-30deg" }],
    };
  });

  const bodySize = size * 0.88;
  const radius = bodySize * 0.5;

  return (
    <Animated.View style={[styles.gemWrap, { width: size, height: size }, wrapStyle]}>
      {/* 3D gem body */}
      <View
        style={[
          styles.body,
          {
            width: bodySize,
            height: bodySize,
            borderRadius: radius,
            borderColor: palette.highlight,
            shadowColor: palette.base,
          },
        ]}
      >
        {/* Base gradient */}
        <LinearGradient
          colors={[palette.highlight, palette.base, palette.shadow]}
          start={{ x: 0.3, y: 0.05 }}
          end={{ x: 0.72, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />

        {/* Top faceted highlight */}
        <View
          style={[
            styles.topFacet,
            {
              width: bodySize * 0.74,
              height: bodySize * 0.36,
              borderRadius: bodySize,
              backgroundColor: palette.highlight,
            },
          ]}
        />

        {/* Bottom shade for depth */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.38)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
          pointerEvents="none"
        />

        {/* Bottom crescent highlight (refractive bottom) */}
        <View
          style={[
            styles.bottomCrescent,
            {
              width: bodySize * 0.68,
              height: bodySize * 0.28,
              borderRadius: bodySize,
              borderBottomColor: palette.highlight,
            },
          ]}
        />

        {/* Rim light along top edge */}
        <View
          style={[
            styles.rimLight,
            {
              width: bodySize * 0.82,
              height: bodySize * 0.82,
              borderRadius: bodySize,
              borderTopColor: palette.highlight,
            },
          ]}
        />

        {/* Static specular glint */}
        <View
          style={[
            styles.glint,
            {
              width: bodySize * 0.22,
              height: bodySize * 0.11,
              borderRadius: bodySize,
              backgroundColor: colors.surfaceInverse,
            },
          ]}
        />

        {/* Static micro-glint */}
        <View
          style={[
            styles.glintSmall,
            {
              width: bodySize * 0.09,
              height: bodySize * 0.09,
              borderRadius: bodySize,
              backgroundColor: colors.surfaceInverse,
            },
          ]}
        />

        {/* Engraved icon (subtle) */}
        <Ionicons
          name={GEM_ICON[color]}
          size={size * 0.3}
          color={palette.icon}
          style={styles.icon}
        />

        {/* Brightness lift overlay when selected */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius, backgroundColor: colors.surfaceInverse },
            brightnessStyle,
          ]}
        />

        {/* Sliding reflection highlight (clipped by body overflow:hidden) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shine,
            {
              width: bodySize * 0.42,
              height: bodySize * 1.4,
              borderRadius: bodySize,
            },
            shineStyle,
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.9)", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  gemWrap: { alignItems: "center", justifyContent: "center" },
  body: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowOpacity: 0.6,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  topFacet: {
    position: "absolute",
    top: "6%",
    opacity: 0.82,
  },
  bottomCrescent: {
    position: "absolute",
    bottom: "8%",
    borderBottomWidth: 1.6,
    opacity: 0.55,
    backgroundColor: "transparent",
  },
  rimLight: {
    position: "absolute",
    top: "2%",
    borderWidth: 1,
    borderColor: "transparent",
    borderTopWidth: 1.2,
    opacity: 0.5,
  },
  glint: {
    position: "absolute",
    top: "16%",
    left: "22%",
    opacity: 0.92,
    transform: [{ rotate: "-28deg" }],
  },
  glintSmall: {
    position: "absolute",
    bottom: "22%",
    right: "22%",
    opacity: 0.6,
  },
  icon: {
    opacity: 0.35,
    textShadowColor: colors.surfaceInverse,
    textShadowRadius: 2,
    textShadowOffset: { width: 0, height: 1 },
  },
  shine: {
    position: "absolute",
    top: "-20%",
    overflow: "hidden",
  },
}));
