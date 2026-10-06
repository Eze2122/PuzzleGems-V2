import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmbientBackground } from "@/src/components/AmbientBackground";
import { LevelCard } from "@/src/components/LevelCard";
import { LivesPill, LivesSheet } from "@/src/components/Lives";
import { NavBar } from "@/src/components/NavBar";
import { Sheet } from "@/src/components/Sheet";
import { GameButton, Panel, StarRow, text, useToast } from "@/src/components/ui";
import { LEVELS, TOTAL_LEVELS, worldFor } from "@/src/game/levels";
import { levelName, TKey, useI18n } from "@/src/i18n";
import { useGame } from "@/src/state/GameProvider";
import { colors, fonts } from "@/src/theme";

const WORLDS = [0, 1, 2, 3, 4];

export default function LevelsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useI18n();
  const game = useGame();
  const { toast, showToast } = useToast();
  const [livesOpen, setLivesOpen] = useState(false);
  const [resumeFor, setResumeFor] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrolled = useRef(false);

  const contentW = Math.min(width, 760) - 32 - 30; // screen padding + panel padding/border
  const cols = contentW > 560 ? 6 : contentW > 420 ? 5 : 4;
  const gap = 12;
  const tile = Math.floor((contentW - gap * (cols - 1)) / cols);
  const done = game.progress.completed.length;
  const targetWorld = worldFor(game.pending?.levelId ?? game.maxUnlocked);

  const open = (id: number, resume: boolean) => router.push({ pathname: "/game", params: { level: String(id), ...(resume ? { resume: "1" } : {}) } });

  const onLevel = useCallback((id: number) => {
    if (game.lives <= 0) return setLivesOpen(true);
    if (game.pending?.levelId === id) return setResumeFor(id);
    open(id, false);
  }, [game.lives, game.pending]);

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={text.kicker}>{t("levels.kicker")}</Text>
            <Text style={[text.display, styles.title]}>{t("levels.title")}</Text>
          </View>
          <LivesPill onPress={() => setLivesOpen(true)} />
        </View>
        <Text style={styles.hint}>{t("levels.hint")}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(2, (done / TOTAL_LEVELS) * 100)}%` }]} />
          </View>
          <Text testID="levels-progress-text" style={styles.progressText}>{done}/{TOTAL_LEVELS}</Text>
          <View style={styles.starsPill}>
            <StarRow count={1} size={13} />
            <Text testID="levels-total-stars" style={styles.starsText}>{game.totalStars}/{TOTAL_LEVELS * 3}</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {WORLDS.map((world) => {
          const levels = LEVELS.filter((l) => worldFor(l.id) === world);
          if (!levels.length) return null;
          return (
            <View
              key={world}
              onLayout={(e) => {
                if (world === targetWorld && !scrolled.current && world > 0) {
                  scrolled.current = true;
                  scrollRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: false });
                }
              }}
            >
              <Panel testID={`world-${world}`} style={styles.world}>
                <View style={styles.worldHead}>
                  <Text style={[text.title, styles.worldTitle]}>{t(`world.${world}` as TKey)}</Text>
                  <Text style={styles.worldRange}>{t("levels.range", { from: levels[0].id, to: levels[levels.length - 1].id })}</Text>
                </View>
                <View style={[styles.grid, { gap }]}>
                  {levels.map((level) => {
                    const locked = level.id > game.maxUnlocked;
                    const stars = game.progress.stars[String(level.id)] ?? 0;
                    return (
                      <LevelCard
                        key={level.id}
                        id={level.id}
                        stars={stars}
                        locked={locked}
                        current={level.id === game.maxUnlocked && !game.progress.completed.includes(level.id)}
                        size={tile}
                        label={locked ? t("levels.lockedA11y", { n: level.id }) : `${t("levels.a11y", { n: level.id, stars })} · ${levelName(t, level.id)}`}
                        onPress={() => onLevel(level.id)}
                      />
                    );
                  })}
                </View>
              </Panel>
            </View>
          );
        })}
      </ScrollView>

      <NavBar active="levels" />
      <LivesSheet visible={livesOpen} onClose={() => setLivesOpen(false)} onToast={showToast} />
      <Sheet visible={resumeFor !== null} onClose={() => setResumeFor(null)} testID="resume-sheet">
        <Text style={[text.display, styles.sheetTitle]}>{t("home.levelN", { n: resumeFor ?? 0 })}</Text>
        <Text style={[text.body, styles.sheetBody]}>{t("home.pending", { moves: game.pending?.moves ?? 0 })}</Text>
        <GameButton testID="resume-continue-button" label={t("home.continue")} icon="play" variant="green" onPress={() => { const id = resumeFor!; setResumeFor(null); open(id, true); }} style={styles.sheetBtn} />
        <GameButton testID="resume-restart-button" label={t("home.restartPending")} icon="refresh" variant="white" onPress={() => { const id = resumeFor!; setResumeFor(null); game.clearPending(); open(id, false); }} style={styles.sheetBtn} />
      </Sheet>
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: 16, paddingBottom: 12, width: "100%", maxWidth: 760, alignSelf: "center" },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 32, marginTop: 2 },
  hint: { fontFamily: fonts.semibold, color: colors.textOnColor, fontSize: 14, marginTop: 2, textShadowColor: colors.brandDeep, textShadowRadius: 3 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  progressTrack: { flex: 1, height: 14, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.6)", overflow: "hidden", borderWidth: 1.5, borderColor: colors.surfaceInverse },
  progressFill: { height: "100%", backgroundColor: colors.gold, borderRadius: 7 },
  progressText: { fontFamily: fonts.bold, color: colors.textOnColor, fontSize: 14 },
  starsPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: colors.surfaceSecondary },
  starsText: { fontFamily: fonts.bold, color: colors.onSurface, fontSize: 13 },
  content: { paddingHorizontal: 16, paddingBottom: 16, width: "100%", maxWidth: 760, alignSelf: "center" },
  world: { padding: 12, marginBottom: 14 },
  worldHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 2 },
  worldTitle: { fontSize: 19 },
  worldRange: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  sheetTitle: { fontSize: 28 },
  sheetBody: { marginTop: 6, marginBottom: 12, fontSize: 15 },
  sheetBtn: { alignSelf: "stretch", marginTop: 10 },
});
