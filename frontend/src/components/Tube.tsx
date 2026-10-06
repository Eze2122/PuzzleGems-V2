import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";

import { Gem } from "@/src/components/Gem";
import { GemColor } from "@/src/game/levels";
import { TUBE_CAPACITY } from "@/src/game/logic";
import { colors, fonts } from "@/src/theme";

type TubeProps = {
  gems: GemColor[];
  selected: boolean;
  invalid: boolean;
  onPress: () => void;
  index: number;
  width: number;
  gemSize: number;
  label: string;
};

/** 3D glass jar with a lavender lid. Pulses when selected, shakes on an invalid move. */
export function Tube({ gems, selected, invalid, onPress, index, width, gemSize, label }: TubeProps) {
  const slots = Array.from({ length: TUBE_CAPACITY }, (_, position) => gems[TUBE_CAPACITY - 1 - position]);
  const complete = gems.length === TUBE_CAPACITY && gems.every((g) => g === gems[0]);
  const slotH = gemSize * 0.98;
  const bodyH = slotH * TUBE_CAPACITY + gemSize * 0.62;

  const pulse = useSharedValue(0);
  const shake = useSharedValue(0);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        ), -1, false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [pulse, selected]);

  useEffect(() => {
    if (invalid) {
      shake.value = withSequence(
        withTiming(-7, { duration: 50 }), withTiming(7, { duration: 50 }),
        withTiming(-4, { duration: 50 }), withTiming(4, { duration: 50 }),
        withSpring(0, { damping: 10, stiffness: 220 }),
      );
    }
  }, [invalid, shake]);

  useEffect(() => {
    if (complete) pop.value = withSequence(withTiming(1.08, { duration: 160 }), withSpring(1, { damping: 8 }));
  }, [complete, pop]);

  const tubeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }, { scale: pop.value }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Pressable
      testID={`tube-${index + 1}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [{ width, alignItems: "center" }, pressed && styles.pressed]}
    >
      <Animated.View style={[{ width, alignItems: "center" }, tubeStyle]}>
        <Animated.View pointerEvents="none" style={[styles.halo, { width: width + 10, height: bodyH + 18, borderRadius: width * 0.42 }, haloStyle]} />
        {/* lid */}
        <View style={[styles.lid, { width: width * 0.96, height: Math.max(10, gemSize * 0.3), borderRadius: gemSize * 0.16 }, complete && styles.lidDone]}>
          <LinearGradient
            colors={complete ? [colors.gold, colors.goldDeep] : ["#D9C8FF", "#9F7BFF"]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.lidShine} />
        </View>
        {/* glass body */}
        <View
          style={[
            styles.body,
            { width: width * 0.88, height: bodyH, borderBottomLeftRadius: width * 0.36, borderBottomRightRadius: width * 0.36 },
            selected && styles.bodySelected,
            invalid && styles.bodyInvalid,
          ]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.55)", "rgba(220,205,255,0.28)", "rgba(190,170,255,0.45)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.stack, { paddingBottom: gemSize * 0.22 }]}>
            {slots.map((gem, slot) => (
              <View key={slot} style={{ height: slotH, alignItems: "center", justifyContent: "center" }}>
                {gem ? <Gem color={gem} selected={selected && slot === TUBE_CAPACITY - gems.length} size={gemSize} /> : null}
              </View>
            ))}
          </View>
          <View pointerEvents="none" style={[styles.reflection, { height: bodyH * 0.7 }]} />
          <View pointerEvents="none" style={[styles.reflectionThin, { height: bodyH * 0.4 }]} />
        </View>
      </Animated.View>
      <View style={[styles.label, selected && styles.labelSelected]}>
        <Text style={styles.labelText}>{String(index + 1).padStart(2, "0")}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.97 }] },
  halo: {
    position: "absolute", top: -6,
    backgroundColor: "rgba(255, 220, 120, 0.55)",
    shadowColor: colors.gold, shadowOpacity: 0.9, shadowRadius: 14, shadowOffset: { width: 0, height: 0 },
  },
  lid: {
    overflow: "hidden", zIndex: 1, marginBottom: -3,
    borderWidth: 1.5, borderColor: colors.glassEdge,
    shadowColor: colors.brandDeep, shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
  },
  lidDone: { borderColor: colors.surfaceInverse },
  lidShine: { position: "absolute", top: 2, left: "12%", width: "40%", height: 3, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.75)" },
  body: {
    borderTopLeftRadius: 8, borderTopRightRadius: 8,
    borderWidth: 2, borderColor: colors.glassEdge,
    backgroundColor: colors.glass, overflow: "hidden",
    shadowColor: colors.brandDeep, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  bodySelected: { borderColor: colors.gold, borderWidth: 2.5 },
  bodyInvalid: { borderColor: colors.error, borderWidth: 2.5 },
  stack: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  reflection: { position: "absolute", top: 10, left: "12%", width: 5, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.7)" },
  reflectionThin: { position: "absolute", top: 18, right: "16%", width: 2, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.55)" },
  label: {
    marginTop: 6, paddingHorizontal: 10, height: 20, borderRadius: 10,
    backgroundColor: colors.brandDeep, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)",
  },
  labelSelected: { backgroundColor: colors.goldDeep },
  labelText: { color: colors.textOnColor, fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.5 },
});
