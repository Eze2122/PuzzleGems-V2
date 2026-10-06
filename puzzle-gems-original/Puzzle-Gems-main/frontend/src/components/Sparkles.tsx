import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/src/theme";

type Twinkle = { top: string; left: string; size: number; delay: number; duration: number };

const TWINKLES: Twinkle[] = [
  { top: "6%", left: "10%", size: 2, delay: 0, duration: 2400 },
  { top: "11%", left: "72%", size: 3, delay: 600, duration: 2800 },
  { top: "18%", left: "40%", size: 2, delay: 1200, duration: 2200 },
  { top: "28%", left: "88%", size: 2, delay: 1800, duration: 3200 },
  { top: "38%", left: "6%", size: 3, delay: 400, duration: 2600 },
  { top: "52%", left: "92%", size: 2, delay: 2200, duration: 2400 },
  { top: "66%", left: "14%", size: 2, delay: 1500, duration: 2600 },
  { top: "72%", left: "60%", size: 3, delay: 300, duration: 2800 },
  { top: "83%", left: "22%", size: 2, delay: 2000, duration: 2400 },
  { top: "88%", left: "80%", size: 2, delay: 900, duration: 2600 },
];

function Twinkle({ spec }: { spec: Twinkle }) {
  const { colors } = useTheme();
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withDelay(
      spec.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: spec.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: spec.duration / 2, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(value);
  }, [spec.delay, spec.duration, value]);

  const style = useAnimatedStyle(() => ({
    opacity: value.value * 0.75,
    transform: [{ scale: 0.5 + value.value * 0.9 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: spec.top as `${number}%`,
          left: spec.left as `${number}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size,
          backgroundColor: colors.surfaceInverse,
          shadowColor: colors.brandPrimary,
          shadowOpacity: 0.9,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
        style,
      ]}
    />
  );
}

export function Sparkles() {
  const list = useMemo(() => TWINKLES, []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {list.map((spec, i) => <Twinkle key={i} spec={spec} />)}
    </View>
  );
}
