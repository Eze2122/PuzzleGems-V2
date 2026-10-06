import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

import { Gem } from "@/src/components/Gem";
import { GemColor } from "@/src/game/levels";
import { TUBE_CAPACITY } from "@/src/game/logic";
import { makeStyles, useTheme } from "@/src/theme";

type TubeProps = {
  gems: GemColor[];
  selected: boolean;
  invalid: boolean;
  onPress: () => void;
  index: number;
};

/**
 * Glass tube with polished rim, side reflection, inner depth gradient and a
 * circular pedestal base. Reacts with a subtle pulse when selected and a
 * shake when the move is invalid.
 */
export function Tube({ gems, selected, invalid, onPress, index }: TubeProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const slots = Array.from({ length: TUBE_CAPACITY }, (_, position) => gems[TUBE_CAPACITY - 1 - position]);

  const pulse = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (selected) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 850, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 850, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 220 });
    }
  }, [pulse, selected]);

  useEffect(() => {
    if (invalid) {
      shake.value = withSequence(
        withTiming(-6, { duration: 55 }),
        withTiming(6, { duration: 55 }),
        withTiming(-4, { duration: 55 }),
        withTiming(4, { duration: 55 }),
        withSpring(0, { damping: 10, stiffness: 220 }),
      );
    }
  }, [invalid, shake]);

  const tubeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shake.value },
      { scale: 1 + pulse.value * 0.015 },
    ],
  }));

  const highlightStyle = useAnimatedStyle(() => ({ opacity: pulse.value * 0.9 }));

  return (
    <Pressable
      testID={`tube-${index + 1}`}
      accessibilityRole="button"
      accessibilityLabel={`Tubo ${index + 1}, ${gems.length} gemas`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.tubeShell, tubeStyle]}>
        {/* Soft colored halo (visible when selected) */}
        <Animated.View pointerEvents="none" style={[styles.selectHalo, highlightStyle]}>
          <LinearGradient
            colors={[colors.brandPrimary, "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Tube body */}
        <View style={[styles.tube, selected && styles.selected, invalid && styles.invalid]}>
          {/* Inner background depth */}
          <LinearGradient
            colors={["rgba(255,255,255,0.06)", "rgba(0,0,0,0.35)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Left glass reflection strip */}
          <LinearGradient
            colors={["rgba(255,255,255,0.0)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0.0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glassStripLeft}
          />
          {/* Right subtle reflection */}
          <View style={styles.glassStripRight} />

          {/* Inner top shadow */}
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.innerTopShadow}
          />

          {/* Gems stack */}
          <View style={styles.stack}>
            {slots.map((gem, slotIndex) => (
              <View key={`${index}-${slotIndex}`} style={styles.slot}>
                {gem ? <Gem color={gem} selected={selected && slotIndex === 0} size={42} /> : <View style={styles.emptySlot} />}
              </View>
            ))}
          </View>

          {/* Rim (top opening) */}
          <View style={styles.rimOuter}>
            <LinearGradient
              colors={[colors.surfaceTertiary, colors.surfaceInverse, colors.surfaceTertiary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.rimGradient}
            />
            <View style={styles.rimInner} />
            <View style={styles.rimShine} />
          </View>
        </View>

        {/* Pedestal base */}
        <View style={styles.pedestal}>
          <LinearGradient
            colors={[colors.surfaceInverse, colors.surfaceTertiary, "rgba(0,0,0,0.4)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <View style={styles.pedestalShadow} />
      </Animated.View>

      <View style={styles.labelRow}>
        <Text style={[styles.tubeNumber, selected && styles.selectedNumber]}>{String(index + 1).padStart(2, "0")}</Text>
        {gems.length === 0 && <Ionicons name="add" size={11} color={colors.muted} style={styles.labelIcon} />}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  pressable: { width: "31%", minWidth: 82, alignItems: "center", minHeight: 170, paddingVertical: 4 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },

  tubeShell: {
    width: "88%",
    alignItems: "center",
  },

  selectHalo: {
    position: "absolute",
    top: -6,
    left: -8,
    right: -8,
    bottom: 10,
    borderRadius: 28,
    overflow: "hidden",
  },

  tube: {
    width: "100%",
    height: 142,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    shadowColor: colors.brand,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  selected: {
    borderColor: colors.brandPrimary,
    borderWidth: 1.6,
    shadowOpacity: 0.55,
    shadowRadius: 20,
  },
  invalid: { borderColor: colors.error, borderWidth: 1.6 },

  glassStripLeft: {
    position: "absolute",
    top: 12,
    bottom: 12,
    left: "14%",
    width: 4,
    borderRadius: 4,
    opacity: 0.9,
  },
  glassStripRight: {
    position: "absolute",
    top: 20,
    bottom: 20,
    right: "16%",
    width: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  innerTopShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 24,
  },

  stack: { width: "100%", height: 128, paddingTop: 8, alignItems: "center", justifyContent: "flex-start" },
  slot: { height: 30, alignItems: "center", justifyContent: "center" },
  emptySlot: {
    width: 34,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.3,
  },

  // Rim at top
  rimOuter: {
    position: "absolute",
    top: -5,
    width: "82%",
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  rimGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rimInner: {
    position: "absolute",
    top: 3,
    left: "10%",
    right: "10%",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  rimShine: {
    position: "absolute",
    top: 6,
    left: "35%",
    width: "30%",
    height: 1.5,
    borderRadius: 999,
    backgroundColor: colors.brandPrimary,
    opacity: 0.65,
  },

  // Pedestal under the tube
  pedestal: {
    marginTop: 4,
    width: "70%",
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  pedestalShadow: {
    marginTop: 3,
    width: "58%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    opacity: 0.6,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  tubeNumber: { color: colors.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: "700" },
  selectedNumber: { color: colors.brandPrimary },
  labelIcon: { marginTop: 0 },
}));
