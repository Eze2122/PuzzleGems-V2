import { Ionicons } from "@react-native-vector-icons/ionicons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/src/theme";

type LevelCardProps = {
  id: number;
  stars: number;
  locked: boolean;
  current: boolean;
  size: number;
  label: string;
  onPress: () => void;
};

/** 3D candy tile with number and stars (matches the UI reference). */
export const LevelCard = memo(function LevelCard({ id, stars, locked, current, size, label, onPress }: LevelCardProps) {
  const tile = colors.tiles[(id - 1) % colors.tiles.length];
  const face = locked ? colors.locked : tile.base;
  const deep = locked ? colors.lockedDeep : tile.deep;
  return (
    <Pressable
      testID={`level-${id}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [{ width: size, height: size + 6 }, pressed && styles.pressed]}
    >
      <View style={[styles.deep, { backgroundColor: deep, borderRadius: size * 0.24 }]} />
      <View style={[styles.face, { height: size, backgroundColor: face, borderRadius: size * 0.24 }, current && styles.current]}>
        {!locked && <View style={[styles.gloss, { backgroundColor: tile.top, borderRadius: size * 0.2 }]} />}
        {locked ? (
          <>
            <Text style={[styles.lockedNum, { fontSize: size * 0.2 }]}>{id}</Text>
            <Ionicons name="lock-closed" size={size * 0.3} color={colors.textOnColor} />
          </>
        ) : (
          <>
            <Text style={[styles.num, { fontSize: size * 0.38 }]}>{id}</Text>
            <View style={styles.stars}>
              {[1, 2, 3].map((s) => (
                <Ionicons key={s} name="star" size={size * 0.17} color={s <= stars ? colors.gold : "rgba(255,255,255,0.45)"} style={styles.star} />
              ))}
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressed: { transform: [{ translateY: 3 }] },
  deep: { position: "absolute", left: 0, right: 0, top: 6, bottom: 0 },
  face: {
    alignItems: "center", justifyContent: "center", overflow: "hidden",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.75)",
  },
  current: { borderColor: colors.gold, borderWidth: 3 },
  gloss: { position: "absolute", top: 3, left: 4, right: 4, height: "46%", opacity: 0.85 },
  num: {
    color: colors.textOnColor, fontFamily: fonts.display, marginTop: -4,
    textShadowColor: colors.textShadow, textShadowRadius: 3, textShadowOffset: { width: 0, height: 2 },
  },
  lockedNum: { color: colors.textOnColor, fontFamily: fonts.display, opacity: 0.9 },
  stars: { flexDirection: "row", marginTop: -2 },
  star: { textShadowColor: colors.textShadow, textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
});
