import { Ionicons } from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo } from "react";
import { Modal, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming, ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameButton, IconButton, text } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { colors, fonts } from "@/src/theme";

const CONFETTI_COLORS = ["#FF5FB8", "#FFC93C", "#5AA2FF", "#34E0C8", "#A855F7", "#FF7A2F"];

function ConfettiPiece({ index, width, height }: { index: number; width: number; height: number }) {
  const fall = useSharedValue(0);
  const spec = useMemo(() => ({
    x: ((index * 73) % 100) / 100 * width,
    delay: (index * 97) % 900,
    duration: 2200 + ((index * 131) % 1400),
    size: 7 + (index % 4) * 2,
    drift: ((index % 5) - 2) * 18,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  }), [index, width]);
  useEffect(() => {
    fall.value = withDelay(spec.delay, withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1, false));
  }, [fall, spec]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -40 + fall.value * (height + 80) },
      { translateX: Math.sin(fall.value * 6.28) * spec.drift },
      { rotate: `${fall.value * 720}deg` },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: spec.x, top: 0, width: spec.size, height: spec.size * 1.6, borderRadius: 2, backgroundColor: spec.color }, style]}
    />
  );
}

function BigStar({ filled, index }: { filled: boolean; index: number }) {
  const size = index === 1 ? 84 : 64;
  return (
    <Animated.View entering={ZoomIn.delay(250 + index * 220).springify().damping(9)} style={{ marginTop: index === 1 ? 0 : 22 }}>
      <Ionicons
        name="star"
        size={size}
        color={filled ? colors.gold : "rgba(255,255,255,0.55)"}
        style={styles.bigStarShadow}
        testID={`victory-star-${index + 1}`}
      />
    </Animated.View>
  );
}

type Props = {
  visible: boolean;
  moves: number;
  best: number;
  stars: number;
  isNewBest: boolean;
  isLast: boolean;
  total: number;
  onNext: () => void;
  onLevels: () => void;
};

export function VictoryModal({ visible, moves, best, stars, isNewBest, isLast, total, onNext, onLevels }: Props) {
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const rays = useSharedValue(0);
  useEffect(() => {
    if (visible) rays.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.linear }), -1, false);
    else rays.value = 0;
  }, [visible, rays]);
  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rays.value * 360}deg` }] }));
  const ribbon = useSharedValue(0);
  useEffect(() => { ribbon.value = visible ? withDelay(150, withSpring(1, { damping: 10 })) : 0; }, [visible, ribbon]);
  const ribbonStyle = useAnimatedStyle(() => ({ transform: [{ scale: ribbon.value }, { rotate: "-3deg" }] }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View testID="victory-modal" style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        {Array.from({ length: 26 }, (_, i) => <ConfettiPiece key={i} index={i} width={width} height={height} />)}
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card}>
          <LinearGradient colors={["#7B6BFF", "#B58CFF", "#FFE3F4"]} style={StyleSheet.absoluteFill} />
          <View style={styles.close}>
            <IconButton testID="victory-close" icon="close" label={t("victory.levels")} onPress={onLevels} size={40} variant="purple" />
          </View>
          <View style={styles.raysWrap} pointerEvents="none">
            <Animated.View style={[styles.rays, raysStyle]}>
              {Array.from({ length: 12 }, (_, i) => (
                <View key={i} style={[styles.ray, { transform: [{ rotate: `${i * 30}deg` }] }]} />
              ))}
            </Animated.View>
          </View>
          <View style={styles.starsRow}>
            {[0, 1, 2].map((i) => <BigStar key={i} index={i} filled={i < stars} />)}
          </View>
          <Animated.View style={[styles.ribbon, ribbonStyle]}>
            <Text style={[text.display, styles.ribbonText]} numberOfLines={1} adjustsFontSizeToFit>{t("victory.title")}</Text>
          </Animated.View>
          <Text style={styles.kicker}>{t("victory.kicker")}</Text>
          <Text style={styles.body}>{isLast ? t("victory.allDone", { total }) : t("victory.body")}</Text>
          <View style={styles.resultCard}>
            <View style={styles.result}>
              <Text testID="victory-moves" style={styles.resultValue}>{moves}</Text>
              <Text style={styles.resultLabel}>{t("victory.moves")}</Text>
            </View>
            <View style={styles.rule} />
            <View style={styles.result}>
              <Text testID="victory-best" style={styles.resultValue}>{best}</Text>
              <Text style={styles.resultLabel}>{t("victory.best")}</Text>
            </View>
          </View>
          {isNewBest && (
            <View testID="victory-new-best" style={styles.newBest}>
              <Ionicons name="trophy" size={14} color={colors.onWarning} />
              <Text style={styles.newBestText}>{t("victory.newBest")}</Text>
            </View>
          )}
          {!isLast && (
            <GameButton testID="victory-next-button" label={t("victory.next")} iconRight="arrow-forward" variant="green" size="lg" onPress={onNext} style={styles.btn} />
          )}
          <GameButton testID="victory-levels-button" label={t("victory.levels")} variant="white" onPress={onLevels} style={styles.btn} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.backdrop, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  card: {
    width: "100%", maxWidth: 420, borderRadius: 34, overflow: "hidden", alignItems: "center",
    paddingHorizontal: 22, paddingTop: 30, paddingBottom: 20,
    borderWidth: 3, borderColor: colors.surfaceInverse,
    shadowColor: colors.brandDeep, shadowOpacity: 0.4, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 14,
  },
  close: { position: "absolute", top: 12, right: 12, zIndex: 2 },
  raysWrap: { position: "absolute", top: -60, left: 0, right: 0, height: 300, alignItems: "center", justifyContent: "center" },
  rays: { width: 300, height: 300, alignItems: "center", justifyContent: "center" },
  ray: { position: "absolute", width: 26, height: 300, backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 13 },
  starsRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  bigStarShadow: { textShadowColor: "rgba(194,120,3,0.75)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 4 } },
  ribbon: {
    marginTop: 8, paddingHorizontal: 26, height: 56, borderRadius: 18, justifyContent: "center",
    backgroundColor: colors.brand, borderWidth: 3, borderColor: "rgba(255,255,255,0.85)", maxWidth: "100%",
  },
  ribbonText: { fontSize: 28 },
  kicker: { marginTop: 14, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, color: colors.brandDeep },
  body: { marginTop: 4, fontFamily: fonts.medium, fontSize: 15, color: colors.onSurface, textAlign: "center" },
  resultCard: {
    flexDirection: "row", alignSelf: "stretch", marginTop: 16, paddingVertical: 14, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.85)", borderWidth: 2, borderColor: colors.surfaceInverse,
  },
  result: { flex: 1, alignItems: "center" },
  resultValue: { fontFamily: fonts.display, fontSize: 30, color: colors.onSurface },
  resultLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  rule: { width: 2, backgroundColor: colors.divider, marginVertical: 4 },
  newBest: {
    flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 12, height: 28, borderRadius: 14,
    backgroundColor: colors.gold,
  },
  newBestText: { fontFamily: fonts.bold, fontSize: 13, color: colors.onWarning },
  btn: { alignSelf: "stretch", marginTop: 12 },
});
