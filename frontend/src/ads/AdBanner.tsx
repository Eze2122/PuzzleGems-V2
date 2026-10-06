import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AD_UNITS } from "@/src/ads/config";
import { getAdsLib, isAdsReady, onAdsReady } from "@/src/ads";

/** Anchored adaptive banner. Only for Home / Levels / Settings — never on the game board. */
export function AdBanner() {
  const [ready, setReady] = useState(isAdsReady());
  const [failed, setFailed] = useState(false);
  useEffect(() => onAdsReady(setReady), []);
  const m = getAdsLib();
  if (!m || !ready || failed) return null;
  const { BannerAd, BannerAdSize } = m;
  return (
    <View testID="ad-banner" style={styles.wrap}>
      <BannerAd unitId={AD_UNITS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: "center", marginTop: 8 } });
