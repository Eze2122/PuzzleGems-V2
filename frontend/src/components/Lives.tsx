import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { showRewardedAd } from "@/src/ads";
import { Sheet } from "@/src/components/Sheet";
import { GameButton, text } from "@/src/components/ui";
import { formatCountdown, MAX_LIVES } from "@/src/game/lives";
import { useI18n } from "@/src/i18n";
import { useGame } from "@/src/state/GameProvider";
import { colors, fonts } from "@/src/theme";

/** Heart counter; tapping opens the lives panel. */
export function LivesPill({ onPress, testID = "lives-pill" }: { onPress: () => void; testID?: string }) {
  const { lives, msToNextLife } = useGame();
  const { t } = useI18n();
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={t("lives.a11y", { n: lives })} onPress={onPress} style={styles.pill}>
      <Ionicons name="heart" size={22} color={colors.heart} style={styles.heartShadow} />
      <Text testID="lives-count" style={styles.count}>{lives}</Text>
      {lives < MAX_LIVES && <Text testID="lives-timer" style={styles.timer}>{formatCountdown(msToNextLife)}</Text>}
      {lives < MAX_LIVES && (
        <View style={styles.plus}><Ionicons name="add" size={14} color={colors.onWarning} /></View>
      )}
    </Pressable>
  );
}

/** Lives panel: hearts, countdown and an optional rewarded ad for +1 life. */
export function LivesSheet({ visible, onClose, onToast }: { visible: boolean; onClose: () => void; onToast: (msg: string) => void }) {
  const { lives, msToNextLife, grantLife } = useGame();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  const watch = async () => {
    setBusy(true);
    const result = await showRewardedAd();
    setBusy(false);
    if (result === "rewarded") {
      grantLife();
      onToast(t("lives.gained"));
      onClose();
    } else {
      onToast(t(result === "dismissed" ? "lives.adDismissed" : "lives.adUnavailable"));
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} testID="lives-sheet">
      <Text style={[text.display, styles.title]}>{lives === 0 ? t("lives.noneTitle") : t("lives.title")}</Text>
      <View style={styles.hearts}>
        {Array.from({ length: MAX_LIVES }, (_, i) => (
          <Ionicons key={i} name={i < lives ? "heart" : "heart-outline"} size={34} color={i < lives ? colors.heart : colors.locked} />
        ))}
      </View>
      <Text testID="lives-sheet-status" style={styles.status}>
        {lives >= MAX_LIVES ? t("lives.full") : t("lives.next", { time: formatCountdown(msToNextLife) })}
      </Text>
      <Text style={[text.body, styles.rule]}>{t("lives.rule")}</Text>
      {lives < MAX_LIVES && (
        <GameButton testID="watch-ad-life-button" label={t("lives.watchAd")} icon="play-circle" variant="gold" onPress={watch} disabled={busy} style={styles.btn} />
      )}
      <GameButton testID="lives-sheet-close" label={t("common.close")} variant="white" size="sm" onPress={onClose} style={styles.btn} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6, height: 44, paddingHorizontal: 12, borderRadius: 22,
    backgroundColor: colors.surfaceSecondary, borderWidth: 2, borderColor: colors.border,
    shadowColor: colors.brandDeep, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  heartShadow: { textShadowColor: "rgba(190,24,93,0.4)", textShadowRadius: 3, textShadowOffset: { width: 0, height: 2 } },
  count: { fontFamily: fonts.display, fontSize: 20, color: colors.onSurface },
  timer: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  plus: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, textAlign: "center" },
  hearts: { flexDirection: "row", gap: 6, marginVertical: 16 },
  status: { fontFamily: fonts.bold, fontSize: 17, color: colors.onSurface },
  rule: { fontSize: 13, marginTop: 6, marginBottom: 16, textAlign: "center" },
  btn: { alignSelf: "stretch", marginTop: 8 },
});
