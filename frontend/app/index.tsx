import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { useI18n } from "@/src/i18n";
import { useGame } from "@/src/state/GameProvider";
import { colors, fonts } from "@/src/theme";

// Approved start screen art (SPLASH_REFERENCIA_PUZZLE_GEMS.png, left panel 894x1024).
const POSTER = require("../assets/images/splash-poster.jpg");
const POSTER_W = 894;
const POSTER_H = 1024;
// Loading bar rectangle inside the poster (px), animated on top of the artwork.
const BAR = { x: 246, y: 821, w: 422, h: 56 };
const MIN_MS = 1900;

export default function StartScreen() {
  const { width, height } = useWindowDimensions();
  const { loaded } = useGame();
  const { ready, t } = useI18n();
  const [minDone, setMinDone] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withTiming(0.85, { duration: MIN_MS, easing: Easing.out(Easing.cubic) }));
    const id = setTimeout(() => setMinDone(true), MIN_MS);
    return () => clearTimeout(id);
  }, [progress]);

  useEffect(() => {
    if (!minDone || !loaded || !ready) return;
    progress.set(withTiming(1, { duration: 300 }));
    const id = setTimeout(() => router.replace("/home"), 380);
    return () => clearTimeout(id);
  }, [minDone, loaded, ready, progress]);

  // Same math as contentFit="cover" so the bar sits exactly on the painted one.
  const scale = Math.max(width / POSTER_W, height / POSTER_H);
  const dx = (width - POSTER_W * scale) / 2;
  const dy = (height - POSTER_H * scale) / 2;
  const bar = { left: dx + BAR.x * scale, top: dy + BAR.y * scale, width: BAR.w * scale, height: BAR.h * scale };
  const inner = bar.height * 0.2;

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View testID="start-screen" style={styles.root}>
      <Image source={POSTER} contentFit="cover" style={StyleSheet.absoluteFill} />
      <View
        testID="start-loading-bar"
        accessibilityLabel={t("app.loading")}
        style={[styles.bar, bar, { borderRadius: bar.height / 2, padding: inner }]}
      >
        <View style={[styles.track, { borderRadius: bar.height / 2 }]}>
          <Animated.View style={[styles.fill, { borderRadius: bar.height / 2 }, fillStyle]}>
            <LinearGradient
              colors={["#FF7AD9", "#B07CFF", "#7FB2FF"]}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.fillGloss} />
            <View style={[styles.spark, { width: bar.height * 0.6, height: bar.height * 0.6, borderRadius: bar.height }]} />
          </Animated.View>
        </View>
      </View>
      <Text style={[styles.hint, { top: bar.top + bar.height + 10 }]}>{t("app.loading")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brand },
  bar: {
    position: "absolute", backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 2, borderColor: "rgba(180,150,255,0.9)",
    shadowColor: colors.brandPrimary, shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  track: { flex: 1, backgroundColor: colors.track, overflow: "hidden" },
  fill: { height: "100%", overflow: "hidden", justifyContent: "center", alignItems: "flex-end" },
  fillGloss: { position: "absolute", top: 2, left: 6, right: 6, height: "35%", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.45)" },
  spark: { backgroundColor: "rgba(255,255,255,0.85)", marginRight: 2, shadowColor: colors.surfaceInverse, shadowOpacity: 1, shadowRadius: 8 },
  hint: {
    position: "absolute", left: 0, right: 0, textAlign: "center",
    fontFamily: fonts.semibold, fontSize: 14, color: colors.textOnColor,
    textShadowColor: colors.brandDeep, textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
  },
});
