import { Ionicons } from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutAnimation, Platform, StyleSheet, Text, UIManager, View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { maybeShowInterstitial, registerLevelCompleted } from "@/src/ads";
import { useAudio } from "@/src/audio/AudioProvider";
import { AmbientBackground } from "@/src/components/AmbientBackground";
import { LivesPill, LivesSheet } from "@/src/components/Lives";
import { Sheet } from "@/src/components/Sheet";
import { Tube } from "@/src/components/Tube";
import { GameButton, IconButton, IconName, text, useToast } from "@/src/components/ui";
import { VictoryModal } from "@/src/components/VictoryModal";
import { colorCount, getLevel, hasAnyMove, TOTAL_LEVELS, worldFor } from "@/src/game/levels";
import { canMoveGem, cloneTubes, isPuzzleComplete, moveGem, Tubes } from "@/src/game/logic";
import { levelName, useI18n } from "@/src/i18n";
import { useGame } from "@/src/state/GameProvider";
import type { CompletionResult } from "@/src/storage/progress";
import { colors, fonts } from "@/src/theme";

if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true);

const haptic = (fn: () => Promise<void>) => { if (Platform.OS !== "web") void fn().catch(() => {}); };

function Stat({ testID, icon, value, label, tint }: { testID: string; icon: IconName; value: number; label: string; tint: string }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={15} color={colors.textOnColor} />
      </View>
      <Text testID={testID} style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function GameScreen() {
  const params = useLocalSearchParams<{ level?: string; resume?: string }>();
  const game = useGame();
  const audio = useAudio();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();

  const [levelId, setLevelId] = useState(() => getLevel(Number(params.level) || game.currentLevel).id);
  const level = useMemo(() => getLevel(levelId), [levelId]);

  // Restore an unfinished game if requested, otherwise start fresh (original logic preserved).
  const [initial] = useState(() => {
    const p = game.pending;
    if (params.resume === "1" && p && p.levelId === levelId) return { tubes: p.tubes, history: p.history ?? [], moves: p.moves };
    return { tubes: cloneTubes(level.tubes), history: [] as Tubes[], moves: 0 };
  });
  const [tubes, setTubes] = useState<Tubes>(initial.tubes);
  const [history, setHistory] = useState<Tubes[]>(initial.history);
  const [moves, setMoves] = useState(initial.moves);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [invalidTube, setInvalidTube] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [livesOpen, setLivesOpen] = useState(false);
  const [board, setBoard] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (params.resume !== "1" && game.pending) game.clearPending();
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { audio.setTrack(worldFor(levelId)); }, [audio, levelId]);

  const startLevel = useCallback((id: number) => {
    const next = getLevel(id);
    setLevelId(next.id);
    setTubes(cloneTubes(next.tubes));
    setHistory([]);
    setMoves(0);
    setSelectedTube(null);
    setInvalidTube(null);
    setComplete(false);
    setFailed(false);
    setResult(null);
    game.clearPending();
    router.setParams({ level: String(next.id), resume: "0" });
  }, [game]);

  const handleTubePress = (target: number) => {
    if (complete || failed || invalidTube !== null) return;
    if (selectedTube === null) {
      haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
      if (!tubes[target]?.length) return;
      setSelectedTube(target);
      return;
    }
    if (selectedTube === target) {
      setSelectedTube(null);
      return;
    }
    if (!canMoveGem(tubes, selectedTube, target)) {
      setInvalidTube(target);
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
      setTimeout(() => { setInvalidTube(null); setSelectedTube(null); }, 320);
      return;
    }
    const nextTubes = moveGem(tubes, selectedTube, target);
    const nextHistory = [...history, cloneTubes(tubes)];
    const nextMoves = moves + 1;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistory(nextHistory);
    setTubes(nextTubes);
    setMoves(nextMoves);
    setSelectedTube(null);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    audio.playMove();

    if (isPuzzleComplete(nextTubes)) {
      setComplete(true);
      setResult(game.recordWin(levelId, nextMoves));
      registerLevelCompleted();
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      audio.playWin();
      return;
    }
    if (!hasAnyMove(nextTubes)) {
      // Stuck: the level is lost → -1 life.
      setFailed(true);
      game.consumeLife();
      game.clearPending();
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
      return;
    }
    game.savePending({ levelId, tubes: nextTubes, history: nextHistory, moves: nextMoves });
  };

  const undo = () => {
    if (!history.length || complete || failed) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const prev = history[history.length - 1];
    const nextHistory = history.slice(0, -1);
    const nextMoves = Math.max(0, moves - 1);
    setTubes(prev);
    setHistory(nextHistory);
    setMoves(nextMoves);
    setSelectedTube(null);
    game.savePending({ levelId, tubes: prev, history: nextHistory, moves: nextMoves });
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  };

  const goToLevels = useCallback(() => router.replace("/levels"), []);

  const afterVictory = async (next: boolean) => {
    await maybeShowInterstitial(); // natural transition, at most every 3 levels
    if (next && levelId < TOTAL_LEVELS) {
      if (game.lives > 0) startLevel(levelId + 1);
      else { setComplete(false); setLivesOpen(true); }
    } else {
      goToLevels();
    }
  };

  const retry = () => {
    if (game.lives <= 0) return setLivesOpen(true);
    startLevel(levelId);
  };

  // ---------- responsive board layout ----------
  const n = tubes.length;
  const cols = n <= 3 ? n : n <= 6 ? 3 : n <= 8 ? 4 : n <= 10 ? 5 : 6;
  const rows = Math.ceil(n / cols);
  const gap = cols >= 5 ? 6 : 12;
  const availW = Math.max(0, board.w - 20);
  const tubeW = Math.min(104, (availW - gap * (cols - 1)) / cols);
  const rowH = (board.h - 34) / rows - 42; // hint + label + spacing
  const gemSize = Math.max(18, Math.min(62, tubeW * 0.74, rowH / 4.95));
  const tubeRows = Array.from({ length: rows }, (_, r) => tubes.map((_, i) => i).slice(r * cols, r * cols + cols));

  return (
    <View testID="game-screen" style={styles.root}>
      <AmbientBackground />
      <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <IconButton testID="back-to-levels" icon="arrow-back" label={t("game.back")} onPress={() => (router.canGoBack() ? router.back() : goToLevels())} />
          <View style={styles.titleWrap}>
            <Text testID="game-level-label" style={styles.kicker}>{t("game.level", { n: String(level.id).padStart(2, "0") })}</Text>
            <Text style={[text.display, styles.title]} numberOfLines={1}>{levelName(t, level.id)}</Text>
          </View>
          <LivesPill testID="game-lives-pill" onPress={() => setLivesOpen(true)} />
        </View>

        <View style={styles.stats}>
          <Stat testID="moves-counter" icon="swap-horizontal" value={moves} label={t("game.moves")} tint={colors.brandPrimary} />
          <Stat testID="goal-counter" icon="flag" value={level.par} label={t("game.goal")} tint={colors.goldDeep} />
          <Stat testID="colors-counter" icon="color-palette" value={colorCount(level)} label={t("game.colors")} tint={colors.info} />
        </View>

        <View testID="game-board" style={styles.board} onLayout={(e) => setBoard({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
          <Text style={styles.boardHint}>{selectedTube === null ? t("game.hintStart") : t("game.hintPlace")}</Text>
          {board.w > 0 && (
            <View style={styles.rows}>
              {tubeRows.map((row, r) => (
                <View key={r} style={[styles.row, { gap }]}>
                  {row.map((index) => (
                    <Tube
                      key={index}
                      gems={tubes[index]}
                      index={index}
                      width={tubeW}
                      gemSize={gemSize}
                      label={t("game.tube", { n: index + 1, count: tubes[index].length })}
                      selected={selectedTube === index}
                      invalid={invalidTube === index}
                      onPress={() => handleTubePress(index)}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

                <View style={styles.dock}>
          <GameButton testID="undo-button" label={t("game.undo")} icon="arrow-undo" variant="purple" onPress={undo} disabled={!history.length || complete || failed} badge={history.length} style={styles.dockBtn} />
          <GameButton testID="restart-button" label={t("game.restart")} icon="refresh" variant="purple" onPress={() => setConfirmRestart(true)} disabled={complete} style={styles.dockBtn} />
        </View>

        <View style={styles.bannerContainer}>
          <BannerAd
            unitId="ca-app-pub-7902708143841298/6646006186"
            size={BannerAdSize.BANNER}
          />
        </View>
      </View>

      <Sheet visible={confirmRestart} onClose={() => setConfirmRestart(false)} testID="restart-sheet">
        <Text style={[text.display, styles.sheetTitle]}>{t("restart.title")}</Text>
        <Text style={[text.body, styles.sheetBody]}>{t("restart.body")}</Text>
        <GameButton testID="restart-confirm-button" label={t("restart.confirm")} icon="refresh" variant="pink" onPress={() => { setConfirmRestart(false); startLevel(levelId); }} style={styles.sheetBtn} />
        <GameButton testID="restart-cancel-button" label={t("common.cancel")} variant="white" onPress={() => setConfirmRestart(false)} style={styles.sheetBtn} />
      </Sheet>

      <Sheet visible={failed && !livesOpen} testID="fail-sheet">
        <Text style={[text.display, styles.sheetTitle]}>{t("fail.title")}</Text>
        <Text style={[text.body, styles.sheetBody]}>{t("fail.body")}</Text>
        <GameButton testID="fail-retry-button" label={t("fail.retry")} icon="refresh" variant="green" onPress={retry} style={styles.sheetBtn} />
        <GameButton testID="fail-levels-button" label={t("fail.levels")} variant="white" onPress={goToLevels} style={styles.sheetBtn} />
      </Sheet>

      <VictoryModal
        visible={complete && !!result}
        moves={moves}
        best={result?.best ?? moves}
        stars={result?.stars ?? 1}
        isNewBest={!!result?.isNewBest}
        isLast={levelId >= TOTAL_LEVELS}
        total={TOTAL_LEVELS}
        onNext={() => void afterVictory(true)}
        onLevels={() => void afterVictory(false)}
      />
      <LivesSheet visible={livesOpen} onClose={() => setLivesOpen(false)} onToast={showToast} />
      {toast}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, paddingHorizontal: 14, width: "100%", maxWidth: 820, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleWrap: { flex: 1, alignItems: "center" },
  kicker: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.5, color: colors.gold, textShadowColor: colors.brandDeep, textShadowRadius: 3 },
  title: { fontSize: 22 },
  stats: { flexDirection: "row", gap: 10, marginTop: 12 },
  stat: {
    flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border,
    shadowColor: colors.brandDeep, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  statIcon: { width: 26, height: 26, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: fonts.display, fontSize: 24, color: colors.onSurface, marginTop: 2 },
  statLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.muted },
  board: {
    flex: 1, marginTop: 12, borderRadius: 30, paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.28)", borderWidth: 2, borderColor: "rgba(255,255,255,0.75)",
  },
  boardHint: { textAlign: "center", fontFamily: fonts.semibold, fontSize: 13, color: colors.onSurface },
  rows: { flex: 1, justifyContent: "space-evenly" },
  row: { flexDirection: "row", justifyContent: "center", alignItems: "flex-end" },
  dock: { flexDirection: "row", gap: 12, marginTop: 12 },
dockBtn: { flex: 1 },
bannerContainer: {
  alignItems: "center",
  justifyContent: "center",
  marginTop: 8,
  minHeight: 50,
},

  sheetTitle: { fontSize: 28, textAlign: "center" },
  sheetBody: { marginTop: 8, marginBottom: 12, fontSize: 15, textAlign: "center" },
  sheetBtn: { alignSelf: "stretch", marginTop: 10 },
});
