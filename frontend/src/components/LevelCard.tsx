import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GameLevel } from "@/src/game/levels";
import { makeStyles, useTheme } from "@/src/theme";

type LevelCardProps = { level: GameLevel; completed: boolean; locked: boolean; best?: number; onPress: () => void };

export function LevelCard({ level, completed, locked, best, onPress }: LevelCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();

  const statusIcon = locked
    ? ("lock-closed" as const)
    : completed
      ? ("checkmark-circle" as const)
      : ("play-circle" as const);
  const statusColor = locked ? colors.muted : completed ? colors.success : colors.brandPrimary;

  return (
    <Pressable
      testID={`level-${level.id}`}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        completed && styles.complete,
        pressed && styles.pressed,
        locked && styles.locked,
      ]}
    >
      {/* Inner gradient background for depth */}
      <LinearGradient
        colors={
          completed
            ? ["rgba(16, 185, 129, 0.18)", "rgba(16, 185, 129, 0.04)"]
            : ["rgba(255, 255, 255, 0.045)", "rgba(255, 255, 255, 0.0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top accent sheen */}
      <View style={styles.sheen} />

      <View style={styles.cardTop}>
        <View style={[styles.number, completed && styles.numberComplete]}>
          <LinearGradient
            colors={
              completed
                ? [colors.success, "#064E3B"]
                : [colors.surfaceTertiary, colors.surfaceSecondary]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.numberText}>{level.id}</Text>
        </View>
        <View style={styles.statusWrap}>
          <Ionicons name={statusIcon} size={locked ? 17 : 22} color={statusColor} />
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{level.title}</Text>
      <Text style={styles.difficulty}>{level.difficulty}</Text>

      <View style={styles.footer}>
        <View style={styles.parPill}>
          <Ionicons name="flag-outline" size={10} color={colors.brandPrimary} />
          <Text style={styles.par}>PAR {level.par}</Text>
        </View>
        {best
          ? <Text style={styles.best}>{best} mov.</Text>
          : <Text style={styles.best}>{level.tubes.length - 2} colores</Text>}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 148,
    marginBottom: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  complete: { borderColor: colors.success },
  locked: { opacity: 0.48 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },

  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.borderStrong,
    opacity: 0.5,
  },

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  number: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  numberComplete: { borderColor: colors.success },
  numberText: { color: colors.onSurface, fontSize: 14, fontWeight: "800" },
  statusWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { color: colors.onSurface, fontSize: 15, fontWeight: "800", marginBottom: 4, letterSpacing: -0.2 },
  difficulty: { color: colors.muted, fontSize: 12 },

  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 },
  parPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.brandTertiary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  par: { color: colors.brandPrimary, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  best: { color: colors.muted, fontSize: 11, fontWeight: "600" },
}));
