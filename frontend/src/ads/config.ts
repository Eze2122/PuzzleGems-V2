import { Platform } from "react-native";

/**
 * AdMob configuration — the ONLY place with ad IDs.
 *
 * Android:
 * - Real App ID
 * - Real Banner Ad Unit
 *
 * Interstitial and Rewarded remain Google's official TEST IDs
 * until their real AdMob units are created.
 */

// Real AdMob App IDs
export const ANDROID_APP_ID = "ca-app-pub-7902708143841298~6437913199";
export const IOS_APP_ID = "ca-app-pub-3940256099942544~1458009866";

const AD_UNITS_CONFIG = {
  android: {
    // Real Puzzle Gems banner
    banner: "ca-app-pub-7902708143841298/6646006186",

    // Google official test IDs
    interstitial: "ca-app-pub-3940256099942544/1033173712",
    rewarded: "ca-app-pub-3940256099942544/5224354917",
  },

  ios: {
    // Google official test IDs
    banner: "ca-app-pub-3940256099942544/2934735716",
    interstitial: "ca-app-pub-3940256099942544/4411468910",
    rewarded: "ca-app-pub-3940256099942544/1712485313",
  },
};

export const AD_UNITS =
  Platform.OS === "ios"
    ? AD_UNITS_CONFIG.ios
    : AD_UNITS_CONFIG.android;

/** Show at most one interstitial every N completed levels, only at natural transitions. */
export const INTERSTITIAL_EVERY_LEVELS = 3;
