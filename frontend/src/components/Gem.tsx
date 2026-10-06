import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from "react-native-reanimated";
import Svg, { Defs, Ellipse, LinearGradient as SvgGradient, Polygon, Stop } from "react-native-svg";

import { GemColor } from "@/src/game/levels";
import { colors } from "@/src/theme";

type GemProps = { color: GemColor; selected?: boolean; size?: number };

// ---- faceted "brilliant cut" geometry (top view), computed once ----
const SIDES = 8;
const pt = (r: number, i: number) => {
  const a = ((i * 360) / SIDES - 90 + 180 / SIDES) * (Math.PI / 180);
  return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
};
type Facet = { points: string; light: number };
const FACETS: Facet[] = (() => {
  const out: Facet[] = [];
  const LIGHT = (-135 * Math.PI) / 180; // light from top-left
  const shade = (cx: number, cy: number, jitter: number) => {
    const a = Math.atan2(cy - 50, cx - 50);
    return Math.max(0, Math.min(1, 0.5 + 0.45 * Math.cos(a - LIGHT) + jitter));
  };
  for (let i = 0; i < SIDES; i++) {
    const P0 = pt(47, i), P1 = pt(47, i + 1);
    const T0 = pt(25, i), T1 = pt(25, i + 1);
    const mid = pt(30, i + 0.5);
    const tri = (a: readonly number[], b: readonly number[], c: readonly number[], j: number) => {
      const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
      out.push({ points: `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`, light: shade(cx, cy, j) });
    };
    tri(P0, P1, mid, 0.06);
    tri(P0, mid, T0, -0.08);
    tri(P1, T1, mid, 0.02);
  }
  return out;
})();
const OUTLINE = Array.from({ length: SIDES }, (_, i) => pt(47, i).join(",")).join(" ");
const TABLE = Array.from({ length: SIDES }, (_, i) => pt(25, i).join(",")).join(" ");

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const shadeColor = (base: string, highlight: string, shadow: string, l: number) =>
  l > 0.5 ? mix(base, highlight, (l - 0.5) * 1.6) : mix(shadow, base, l * 2);

const GemArt = memo(function GemArt({ color, size }: { color: GemColor; size: number }) {
  const p = colors.gems[color];
  const fills = useMemo(() => FACETS.map((f) => shadeColor(p.base, p.highlight, p.shadow, f.light)), [p]);
  const id = `g-${color}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <SvgGradient id={id} x1="0.2" y1="0.1" x2="0.8" y2="0.95">
          <Stop offset="0" stopColor={p.highlight} />
          <Stop offset="0.55" stopColor={p.base} />
          <Stop offset="1" stopColor={p.shadow} />
        </SvgGradient>
      </Defs>
      <Polygon points={OUTLINE} fill={p.shadow} />
      {FACETS.map((f, i) => (
        <Polygon key={i} points={f.points} fill={fills[i]} stroke={p.highlight} strokeOpacity={0.35} strokeWidth={0.6} />
      ))}
      <Polygon points={TABLE} fill={`url(#${id})`} stroke={p.highlight} strokeOpacity={0.7} strokeWidth={0.8} />
      <Polygon points={OUTLINE} fill="none" stroke={colors.surfaceInverse} strokeOpacity={0.55} strokeWidth={1.4} />
      <Ellipse cx={38} cy={33} rx={10} ry={5} fill={colors.surfaceInverse} opacity={0.85} transform="rotate(-30 38 33)" />
      <Ellipse cx={64} cy={66} rx={3} ry={3} fill={colors.surfaceInverse} opacity={0.6} />
    </Svg>
  );
});

/** Crystalline faceted gem. Lifts, floats and shimmers while selected. */
export function Gem({ color, selected = false, size = 42 }: GemProps) {
  const lift = useSharedValue(0);
  const float = useSharedValue(0);
  const entrance = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 12, stiffness: 190, mass: 0.6 });
  }, [entrance]);

  useEffect(() => {
    lift.value = withSpring(selected ? -size * 0.24 : 0, { damping: 14, stiffness: 190 });
    if (selected) {
      float.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ), -1, false,
      );
      glow.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })), -1, true);
    } else {
      cancelAnimation(float);
      cancelAnimation(glow);
      float.value = withTiming(0, { duration: 160 });
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [lift, float, glow, selected, size]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value + float.value }, { scale: 0.6 + 0.4 * entrance.value }],
    opacity: entrance.value,
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value * 0.75 }));

  return (
    <Animated.View style={[styles.wrap, { width: size, height: size }, wrapStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { width: size * 1.1, height: size * 1.1, borderRadius: size, backgroundColor: colors.gems[color].highlight }, glowStyle]}
      />
      <View style={[styles.shadow, { shadowColor: colors.gems[color].shadow }]}>
        <GemArt color={color} size={size} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute" },
  shadow: { shadowOpacity: 0.45, shadowRadius: 5, shadowOffset: { width: 0, height: 3 }, elevation: 0 },
});
