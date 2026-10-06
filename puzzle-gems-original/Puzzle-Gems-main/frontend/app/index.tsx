import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, LayoutAnimation, Modal, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, UIManager, useWindowDimensions, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmbientBackground } from "@/src/components/AmbientBackground";
import { LevelCard } from "@/src/components/LevelCard";
import { Sparkles } from "@/src/components/Sparkles";
import { Tube } from "@/src/components/Tube";
import { getLevel, LEVELS } from "@/src/game/levels";
import { canMoveGem, cloneTubes, isPuzzleComplete, moveGem, Tubes } from "@/src/game/logic";
import { emptyProgress, loadProgress, Progress, recordCompletion } from "@/src/storage/progress";
import { makeStyles, useTheme } from "@/src/theme";
import { useAudio } from "@/src/audio/AudioProvider";

if (Platform.OS === "android") UIManager.setLayoutAnimationEnabledExperimental?.(true);

type Screen = "levels" | "game";

export default function Index() {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const audio = useAudio();
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>("levels");
  const [activeLevelId, setActiveLevelId] = useState(1);
  const [tubes, setTubes] = useState<Tubes>([]);
  const [history, setHistory] = useState<Tubes[]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [invalidTube, setInvalidTube] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    loadProgress().then((stored) => { setProgress(stored); setLoading(false); });
  }, []);

  const activeLevel = useMemo(() => getLevel(activeLevelId), [activeLevelId]);
  const maxUnlocked = Math.min(LEVELS.length, Math.max(1, (progress.completed.length ? Math.max(...progress.completed) : 0) + 1));

  const startLevel = useCallback((levelId: number) => {
    const level = getLevel(levelId);
    setActiveLevelId(level.id);
    setTubes(cloneTubes(level.tubes));
    setHistory([]);
    setSelectedTube(null);
    setInvalidTube(null);
    setMoves(0);
    setComplete(false);
    setScreen("game");
  }, []);

  const goToLevels = useCallback(() => {
    setSelectedTube(null);
    setComplete(false);
    setScreen("levels");
  }, []);

  const handleTubePress = async (target: number) => {
    if (complete || invalidTube !== null) return;
    if (selectedTube === null) {
      if (!tubes[target]?.length) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTube(target);
      return;
    }
    if (selectedTube === target) {
      setSelectedTube(null);
      return;
    }
    if (!canMoveGem(tubes, selectedTube, target)) {
      setInvalidTube(target);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => { setInvalidTube(null); setSelectedTube(null); }, 320);
      return;
    }
    const nextTubes = moveGem(tubes, selectedTube, target);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHistory((current) => [...current, cloneTubes(tubes)]);
    setTubes(nextTubes);
    setMoves((current) => current + 1);
    setSelectedTube(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    audio.playMove();
    if (isPuzzleComplete(nextTubes)) {
      const nextMoves = moves + 1;
      setComplete(true);
      const updated = await recordCompletion(activeLevelId, nextMoves);
      setProgress(updated);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      audio.playWin();
    }
  };

  const undo = () => {
    if (!history.length || complete) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTubes(history[history.length - 1]);
    setHistory((current) => current.slice(0, -1));
    setMoves((current) => Math.max(0, current - 1));
    setSelectedTube(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const restart = () => {
    Alert.alert("Reiniciar nivel", "Perderás el progreso de este intento.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Reiniciar", style: "destructive", onPress: () => startLevel(activeLevelId) },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <AmbientBackground />
        <ActivityIndicator size="large" color={colors.brandPrimary} />
        <Text style={styles.loadingText}>Preparando tus gemas…</Text>
      </View>
    );
  }

  if (screen === "levels") {
    return (
      <View style={styles.root}>
        <AmbientBackground />
        <Sparkles />
        <ScrollView
          contentContainerStyle={[styles.levelsContent, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroRow}>
            <View style={styles.logoMark}>
              <LinearGradient
                colors={[colors.brandPrimary, colors.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="diamond" size={22} color={colors.onBrandPrimary} />
            </View>
            <View>
              <Text style={styles.kicker}>SALA DE GEMAS</Text>
              <Text style={styles.heroTitle}>Jewel Sort</Text>
            </View>
            <View style={styles.progressPill}>
              <Ionicons name="sparkles" size={13} color={colors.brandPrimary} />
              <Text style={styles.progressText}>{progress.completed.length}/10</Text>
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroSubtitle}>Ordena el brillo.</Text>
            <Text style={styles.heroHint}>Cada cristal encuentra su lugar.</Text>
          </View>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>Tus niveles</Text>
              <Text style={styles.sectionHint}>Una colección, diez desafíos</Text>
            </View>
            <View style={styles.audioToggles}>
              <TouchableOpacity
                testID="toggle-music"
                accessibilityRole="switch"
                accessibilityLabel={audio.musicEnabled ? "Silenciar música" : "Activar música"}
                accessibilityState={{ checked: audio.musicEnabled }}
                onPress={audio.toggleMusic}
                style={[styles.audioToggle, audio.musicEnabled && styles.audioToggleActive]}
              >
                <Ionicons
                  name={audio.musicEnabled ? "musical-notes" : "musical-notes-outline"}
                  size={16}
                  color={audio.musicEnabled ? colors.brandPrimary : colors.muted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                testID="toggle-sfx"
                accessibilityRole="switch"
                accessibilityLabel={audio.sfxEnabled ? "Silenciar efectos" : "Activar efectos"}
                accessibilityState={{ checked: audio.sfxEnabled }}
                onPress={audio.toggleSfx}
                style={[styles.audioToggle, audio.sfxEnabled && styles.audioToggleActive]}
              >
                <Ionicons
                  name={audio.sfxEnabled ? "volume-high" : "volume-mute"}
                  size={16}
                  color={audio.sfxEnabled ? colors.brandPrimary : colors.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.levelGrid}>
            {LEVELS.map((level) => (
              <LevelCard
                key={level.id}
                level={level}
                completed={progress.completed.includes(level.id)}
                locked={level.id > maxUnlocked}
                best={progress.bestMoves[String(level.id)]}
                onPress={() => startLevel(level.id)}
              />
            ))}
          </View>

          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            </View>
            <Text style={styles.tipText}>Deja siempre un tubo libre para respirar.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <Sparkles />
      <ScrollView
        contentContainerStyle={[styles.gameContent, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.gameHeader}>
          <TouchableOpacity
            testID="back-to-levels"
            accessibilityRole="button"
            accessibilityLabel="Volver a niveles"
            onPress={goToLevels}
            style={styles.iconButton}
          >
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.gameTitleWrap}>
            <Text style={styles.kicker}>NIVEL {String(activeLevel.id).padStart(2, "0")}</Text>
            <Text style={styles.gameTitle}>{activeLevel.title}</Text>
          </View>
          <TouchableOpacity
            testID="restart-top"
            accessibilityRole="button"
            accessibilityLabel="Reiniciar nivel"
            onPress={restart}
            style={styles.iconButton}
          >
            <Ionicons name="refresh" size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Stats chips */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="swap-horizontal" size={16} color={colors.brandPrimary} />
            </View>
            <Text style={styles.statValue}>{moves}</Text>
            <Text style={styles.statLabel}>MOVIMIENTOS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Ionicons name="flag-outline" size={16} color={colors.warning} />
            </View>
            <Text style={styles.statValue}>{activeLevel.par}</Text>
            <Text style={styles.statLabel}>OBJETIVO</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <View style={[styles.statIcon, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
              <Ionicons name="layers-outline" size={16} color={colors.info} />
            </View>
            <Text style={styles.statValue}>{tubes.length - 2}</Text>
            <Text style={styles.statLabel}>COLORES</Text>
          </View>
        </View>

        {/* Board */}
        <View style={[styles.boardCard, { minHeight: width * 0.92 }]}>
          <LinearGradient
            colors={["rgba(232, 121, 249, 0.14)", "rgba(232, 121, 249, 0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.boardSheen} />
          <View style={styles.boardHeader}>
            <View style={styles.boardTag}>
              <View style={styles.boardTagDot} />
              <Text style={styles.boardTitle}>TABLERO</Text>
            </View>
            <Text style={styles.boardHint}>
              {selectedTube === null ? "Toca una gema para comenzar" : "Elige dónde colocarla"}
            </Text>
          </View>
          <View style={styles.tubeGrid}>
            {tubes.map((tube, index) => (
              <Tube
                key={index}
                gems={tube}
                index={index}
                selected={selectedTube === index}
                invalid={invalidTube === index}
                onPress={() => void handleTubePress(index)}
              />
            ))}
          </View>
        </View>

        {/* Action dock */}
        <View style={styles.actionDock}>
          <TouchableOpacity
            testID="undo-button"
            accessibilityRole="button"
            accessibilityLabel="Deshacer movimiento"
            onPress={undo}
            disabled={!history.length || complete}
            style={[styles.actionButton, (!history.length || complete) && styles.disabled]}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="arrow-undo" size={18} color={history.length && !complete ? colors.onSurface : colors.muted} />
            </View>
            <Text style={styles.actionText}>Deshacer</Text>
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Reiniciar nivel"
            onPress={restart}
            style={styles.actionButton}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="reload-outline" size={18} color={colors.onSurface} />
            </View>
            <Text style={styles.actionText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Victory modal */}
      <Modal visible={complete} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalBackdrop}>
          <View style={styles.completeSheet}>
            <LinearGradient
              colors={["rgba(232, 121, 249, 0.18)", "rgba(232, 121, 249, 0.02)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.victoryIcon}>
              <LinearGradient
                colors={[colors.brandPrimary, colors.brand]}
                style={styles.victoryGradient}
              >
                <Ionicons name="diamond" size={34} color={colors.onBrandPrimary} />
              </LinearGradient>
            </View>
            <Text style={styles.completeKicker}>DESTELLO CONSEGUIDO</Text>
            <Text style={styles.completeTitle}>Nivel completado</Text>
            <Text style={styles.completeCopy}>Todas las gemas encontraron su hogar.</Text>
            <View style={styles.resultRow}>
              <View>
                <Text style={styles.resultValue}>{moves}</Text>
                <Text style={styles.resultLabel}>MOVIMIENTOS</Text>
              </View>
              <View style={styles.resultRule} />
              <View>
                <Text style={styles.resultValue}>{activeLevel.par >= moves ? "★ ★ ★" : "★ ★ ☆"}</Text>
                <Text style={styles.resultLabel}>BRILLO</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => activeLevelId < LEVELS.length ? startLevel(activeLevelId + 1) : goToLevels}
            >
              <LinearGradient
                colors={[colors.brandPrimary, colors.brand]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.nextButtonText}>
                {activeLevelId < LEVELS.length ? "Siguiente nivel" : "Volver a niveles"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onBrandPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={goToLevels}>
              <Text style={styles.secondaryButtonText}>Ver todos los niveles</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, marginTop: 14, fontSize: 14 },

  levelsContent: { paddingHorizontal: 18 },
  gameContent: { paddingHorizontal: 16 },

  heroRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  logoMark: {
    width: 48, height: 48, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1, borderColor: colors.borderStrong,
    marginRight: 12,
    shadowColor: colors.brand,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  kicker: { color: colors.brandPrimary, fontSize: 10, letterSpacing: 1.8, fontWeight: "800" },
  heroTitle: { color: colors.onSurface, fontSize: 23, fontWeight: "900", letterSpacing: -0.6, marginTop: 3 },
  progressPill: {
    marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, height: 34, borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1, borderColor: colors.border,
  },
  progressText: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "800" },

  heroCopy: { marginBottom: 32 },
  heroSubtitle: { color: colors.onSurface, fontSize: 34, lineHeight: 38, fontWeight: "900", letterSpacing: -1.3 },
  heroHint: { color: colors.muted, fontSize: 15, marginTop: 8 },

  sectionHeading: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "800" },
  sectionHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.divider, marginLeft: 18, marginTop: 10 },
  audioToggles: {
    marginLeft: "auto",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  audioToggle: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  audioToggleActive: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.brandTertiary,
  },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  tip: {
    flexDirection: "row", alignItems: "center", gap: 11,
    padding: 14, borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border,
    marginTop: 10,
  },
  tipIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center", justifyContent: "center",
  },
  tipText: { color: colors.onSurfaceSecondary, fontSize: 12, flex: 1 },

  gameHeader: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  iconButton: {
    width: 46, height: 46, borderRadius: 15,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  gameTitleWrap: { flex: 1, alignItems: "center" },
  gameTitle: { color: colors.onSurface, fontSize: 20, fontWeight: "900", marginTop: 3, letterSpacing: -0.3 },

  statsRow: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statIcon: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  statValue: { color: colors.onSurface, fontSize: 19, fontWeight: "900", marginTop: 1 },
  statLabel: { color: colors.muted, fontSize: 8, letterSpacing: 0.8, fontWeight: "800" },
  statDivider: { width: 1, height: 42, backgroundColor: colors.divider },

  boardCard: {
    borderRadius: 26,
    borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSecondary,
    padding: 16, paddingTop: 14,
    overflow: "hidden",
    shadowColor: colors.brand, shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  boardSheen: {
    position: "absolute", top: 0, left: 0, right: 0, height: 1,
    backgroundColor: colors.borderStrong, opacity: 0.6,
  },
  boardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  boardTag: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 10, height: 24, borderRadius: 999,
    backgroundColor: colors.brandTertiary,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong,
  },
  boardTagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary },
  boardTitle: { color: colors.onSurface, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  boardHint: { color: colors.muted, fontSize: 11 },
  tubeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", rowGap: 10 },

  actionDock: {
    height: 72, marginTop: 16, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    flexDirection: "row", alignItems: "center", justifyContent: "space-evenly",
    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4,
  },
  actionButton: {
    minWidth: 125, height: 54, borderRadius: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  actionIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center", justifyContent: "center",
  },
  actionText: { color: colors.onSurface, fontSize: 13, fontWeight: "700" },
  actionDivider: { height: 32, width: 1, backgroundColor: colors.divider },
  disabled: { opacity: 0.38 },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.78)", alignItems: "center", justifyContent: "center", padding: 22 },
  completeSheet: {
    width: "100%", maxWidth: 390, borderRadius: 30,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1, borderColor: colors.borderStrong,
    padding: 26, alignItems: "center",
    overflow: "hidden",
    shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 32, shadowOffset: { width: 0, height: 14 }, elevation: 12,
  },
  victoryIcon: {
    width: 82, height: 82, borderRadius: 26,
    padding: 6, backgroundColor: colors.brandTertiary,
    marginBottom: 20,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  victoryGradient: { flex: 1, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  completeKicker: { color: colors.brandPrimary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  completeTitle: { color: colors.onSurface, fontSize: 28, fontWeight: "900", marginTop: 8 },
  completeCopy: { color: colors.muted, fontSize: 14, marginTop: 8, textAlign: "center" },
  resultRow: {
    width: "100%", marginVertical: 24, paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider,
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
  },
  resultValue: { color: colors.onSurface, fontSize: 19, fontWeight: "900", textAlign: "center" },
  resultLabel: { color: colors.muted, fontSize: 9, letterSpacing: 0.8, fontWeight: "800", textAlign: "center", marginTop: 5 },
  resultRule: { width: 1, height: 28, backgroundColor: colors.divider },
  nextButton: {
    width: "100%", height: 54, borderRadius: 17,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    overflow: "hidden",
    shadowColor: colors.brand, shadowOpacity: 0.65, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  nextButtonText: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "900" },
  secondaryButton: { minHeight: 44, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryButtonText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
}));
