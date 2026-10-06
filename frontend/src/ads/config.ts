import { Platform } from "react-native";

/**
 * AdMob configuration — the ONLY place with ad IDs.
 *
 * ⚠️ These are Google's OFFICIAL TEST IDs. Before publishing:
 *  1. Replace ANDROID_APP_ID / IOS_APP_ID here AND in app.json
 *     ("react-native-google-mobile-ads" plugin: androidAppId / iosAppId).
 *  2. Replace the ad unit IDs below with your real units (AdMob → App → Ad units).
 *  3. Generate a new native build (App IDs are baked into the native binary).
 */
export const ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
export const IOS_APP_ID = "ca-app-pub-3940256099942544~1458009866";

const TEST_UNITS = {
  android: {
    banner: "ca-app-pub-3940256099942544/6300978111",
    interstitial: "ca-app-pub-3940256099942544/1033173712",
    rewarded: "ca-app-pub-3940256099942544/5224354917",
  },
  ios: {
    banner: "ca-app-pub-3940256099942544/2934735716",
    interstitial: "ca-app-pub-3940256099942544/4411468910",
    rewarded: "ca-app-pub-3940256099942544/1712485313",
  },
};

export const AD_UNITS = Platform.OS === "ios" ? TEST_UNITS.ios : TEST_UNITS.android;

/** Show at most one interstitial every N completed levels, only at natural transitions. */
export const INTERSTITIAL_EVERY_LEVELS = 3;
