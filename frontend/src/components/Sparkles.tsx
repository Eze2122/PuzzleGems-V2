import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from "react-native-reanimated";

import { colors } from "@/src/theme";

type TwinkleSpec = { top: `${number}%`; left: `${number}%`; size: number; delay: number; duration: number };

const TWINKLES: TwinkleSpec[] = [
  { top: "6%", left: "10%", size: 12, delay: 0, duration: 2400 },
  { top: "11%", left: "82%", size: 16, delay: 600, duration: 2800 },
  { top: "22%", left: "46%", size: 9, delay: 1200, duration: 2200 },
  { top: "34%", left: "90%", size: 10, delay: 1800, duration: 3200 },
  { top: "44%", left: "5%", size: 14, delay: 400, duration: 2600 },
  { top: "58%", left: "93%", size: 9, delay: 2200, duration: 2400 },
  { top: "70%", left: "12%", size: 10, delay: 1500, duration: 2600 },
  { top: "84%", left: "70%", size: 13, delay: 300, duration: 2800 },
];

function Twinkle({ spec }: { spec: TwinkleSpec }) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: spec.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: spec.duration / 2, easing: Easing.inOut(Easing.quad) }),
        ), -1, false,
      ),
    );
    return () => cancelAnimation(value);
  }, [spec.delay, spec.duration, value]);

  const style = useAnimatedStyle(() => ({
    opacity: value.value * 0.9,
    transform: [{ scale: 0.4 + value.value * 0.8 }, { rotate: `${value.value * 45}deg` }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", top: spec.top, left: spec.left }, style]}>
      <Ionicons name="sparkles" size={spec.size} color={colors.surfaceInverse} style={styles.glow} />
    </Animated.View>
  );
}

export function Sparkles() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {TWINKLES.map((spec, i) => <Twinkle key={i} spec={spec} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { textShadowColor: colors.gold, textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } },
});
