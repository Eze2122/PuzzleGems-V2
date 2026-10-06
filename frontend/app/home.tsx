import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmbientBackground } from "@/src/components/AmbientBackground";
import { LivesPill, LivesSheet } from "@/src/components/Lives";
import { NavBar } from "@/src/components/NavBar";
import { GameButton, IconButton, Panel, StarRow, text, useToast } from "@/src/components/ui";
import { TOTAL_LEVELS } from "@/src/game/levels";
import { levelName, useI18n } from "@/src/i18n";
import { useGame } from "@/src/state/GameProvider";
import { colors, fonts } from "@/src/theme";

const LOGO_MARK = require("../assets/images/logo-mark.png");
const LOGO_TITLE = require("../assets/images/logo-title.png");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const game = useGame();
  const { toast, showToast } = useToast();
  const [livesOpen, setLivesOpen] = useState(false);

  const done = game.progress.completed.length;
  const allDone = done >= TOTAL_LEVELS;
  const nextLevel = game.pending?.levelId ?? game.maxUnlocked;
  const logoW = Math.min(width * 0.82, 420);

  const withLife = (action: () => void) => (game.lives > 0 ? action() : setLivesOpen(true));
  const play = () => withLife(() => router.push({ pathname: "/game", params: { level: String(nextLevel) } }));
  const resume = () => withLife(() => router.push({ pathname: "/game", params: { level: String(nextLevel), resume: "1" } }));
  const restartPending = () => withLife(() => {
    game.clearPending();
    router.push({ pathname: "/game", params: { level: String(nextLevel) } });
  });

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <IconButton testID="home-settings-button" icon="settings" label={t("nav.settings")} onPress={() => router.replace("/settings")} />
        <LivesPill onPress={() => setLivesOpen(true)} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.logoWrap}>
          <Image source={LOGO_MARK} style={{ width: logoW * 0.36, height: logoW * 0.36 }} contentFit="contain" />
          <Image testID="home-logo" source={LOGO_TITLE} style={{ width: logoW, height: logoW * 0.49, marginTop: -logoW * 0.05 }} contentFit="contain" accessibilityLabel={t("app.name")} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(500)} style={styles.panelWrap}>
          <Panel>
            <Text style={[text.title, styles.panelTitle]}>{t("home.progressTitle")}</Text>
            <View style={styles.progressRow}>
              <Text testID="home-progress-text" style={[text.body, styles.progressText]}>
                {allDone ? t("home.allDone") : t("home.progress", { done, total: TOTAL_LEVELS })}
              </Text>
              <View style={styles.starsPill}>
                <StarRow count={1} size={14} />
                <Text testID="home-total-stars" style={styles.starsText}>{game.totalStars}</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(3, (done / TOTAL_LEVELS) * 100)}%` }]} />
            </View>

            {game.pending ? (
              <>
                <Text testID="home-pending-info" style={[text.body, styles.levelInfo]}>
                  {t("home.levelN", { n: game.pending.levelId })} · {levelName(t, game.pending.levelId)}{"\n"}
                  {t("home.pending", { moves: game.pending.moves })}
                </Text>
                <GameButton testID="home-continue-button" label={t("home.continue")} icon="play" variant="green" size="lg" onPress={resume} />
                <GameButton testID="home-restart-pending-button" label={t("home.restartPending")} icon="refresh" variant="white" size="sm" onPress={restartPending} style={styles.gapTop} />
              </>
            ) : (
              <>
                <Text testID="home-next-level" style={[text.body, styles.levelInfo]}>
                  {t("home.levelN", { n: nextLevel })} · {levelName(t, nextLevel)}
                </Text>
                <GameButton testID="home-play-button" label={t("home.play")} icon="play" variant="green" size="lg" onPress={play} />
              </>
            )}
            <GameButton testID="home-levels-button" label={t("home.levels")} icon="grid" variant="purple" onPress={() => router.replace("/levels")} style={styles.gapTop} />
          </Panel>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(500)} style={styles.tip}>
          <Text style={styles.tipText}>{t("home.tip")}</Text>
        </Animated.View>
      </ScrollView>
      <NavBar active="home" />
      <LivesSheet visible={livesOpen} onClose={() => setLivesOpen(false)} onToast={showToast} />
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16 },
  content: { paddingHorizontal: 16, paddingBottom: 16, alignItems: "center" },
  logoWrap: { alignItems: "center", marginTop: 4 },
  panelWrap: { width: "100%", maxWidth: 480, marginTop: 4 },
  panelTitle: { fontSize: 22 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  progressText: { fontSize: 14, flex: 1 },
  starsPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: colors.brandTertiary },
  starsText: { fontFamily: fonts.bold, color: colors.onSurface, fontSize: 14 },
  progressTrack: { height: 14, borderRadius: 7, backgroundColor: colors.brandTertiary, marginTop: 10, overflow: "hidden", borderWidth: 1, borderColor: colors.surfaceInverse },
  progressFill: { height: "100%", borderRadius: 7, backgroundColor: colors.brandPrimary },
  levelInfo: { fontSize: 15, marginTop: 16, marginBottom: 10, textAlign: "center", color: colors.onSurface },
  gapTop: { marginTop: 10 },
  tip: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(76,29,149,0.45)", maxWidth: 480 },
  tipText: { fontFamily: fonts.semibold, color: colors.textOnColor, fontSize: 13, textAlign: "center" },
});
