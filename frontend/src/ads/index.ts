import Constants, { ExecutionEnvironment } from "expo-constants";

import { AD_UNITS, INTERSTITIAL_EVERY_LEVELS } from "@/src/ads/config";
import { getSave, updateSave } from "@/src/storage/save";

/**
 * Centralized AdMob service (native). The native SDK only exists in a development /
 * production build — in Expo Go every call is a safe no-op. Web uses index.web.ts.
 */
type AdsLib = typeof import("react-native-google-mobile-ads");

let lib: AdsLib | null | undefined;
export function getAdsLib(): AdsLib | null {
  if (lib !== undefined) return lib;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return (lib = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy native-only load
    lib = require("react-native-google-mobile-ads") as AdsLib;
  } catch {
    lib = null;
  }
  return lib;
}

let ready = false;
let initializing: Promise<void> | null = null;
const readyListeners = new Set<(ready: boolean) => void>();
export const isAdsReady = () => ready;
export function onAdsReady(cb: (ready: boolean) => void) {
  readyListeners.add(cb);
  return () => { readyListeners.delete(cb); };
}

/** UMP consent (GDPR) first, then SDK init. Safe to call more than once. */
export function initAds(): Promise<void> {
  if (initializing) return initializing;
  initializing = (async () => {
    const m = getAdsLib();
    if (!m) return;
    try {
      await m.AdsConsent.requestInfoUpdate();
      await m.AdsConsent.loadAndShowConsentFormIfRequired();
    } catch (e) {
      console.warn("[ads] consent update failed", e);
    }
    try {
      const info = await m.AdsConsent.getConsentInfo();
      if (!info.canRequestAds) return;
      await m.default().initialize();
      ready = true;
      readyListeners.forEach((cb) => cb(true));
      loadInterstitial();
      loadRewarded();
    } catch (e) {
      console.warn("[ads] init failed", e);
    }
  })();
  return initializing;
}

export async function showPrivacyOptions(): Promise<boolean> {
  const m = getAdsLib();
  if (!m) return false;
  try {
    await m.AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}

// ---------- Interstitial ----------
let interstitial: ReturnType<AdsLib["InterstitialAd"]["createForAdRequest"]> | null = null;
let interstitialLoaded = false;
let interstitialDone: (() => void) | null = null;

function loadInterstitial() {
  const m = getAdsLib();
  if (!m || !ready) return;
  if (!interstitial) {
    interstitial = m.InterstitialAd.createForAdRequest(AD_UNITS.interstitial);
    interstitial.addAdEventListener(m.AdEventType.LOADED, () => { interstitialLoaded = true; });
    interstitial.addAdEventListener(m.AdEventType.ERROR, () => {
      interstitialLoaded = false;
      interstitialDone?.();
      interstitialDone = null;
    });
    interstitial.addAdEventListener(m.AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      interstitialDone?.();
      interstitialDone = null;
      interstitial?.load();
    });
  }
  interstitial.load();
}

/** Call once per completed level. */
export function registerLevelCompleted() {
  updateSave((s) => ({ levelsSinceAd: s.levelsSinceAd + 1 }));
}

/** Natural transition after a victory: shows an interstitial only every N levels. Never blocks. */
export function maybeShowInterstitial(): Promise<void> {
  if (getSave().levelsSinceAd < INTERSTITIAL_EVERY_LEVELS) return Promise.resolve();
  if (!interstitial || !interstitialLoaded) {
    loadInterstitial();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    interstitialDone = resolve;
    updateSave({ levelsSinceAd: 0 });
    interstitial!.show().catch(() => {
      interstitialDone = null;
      resolve();
    });
  });
}

// ---------- Rewarded (+1 life) ----------
let rewarded: ReturnType<AdsLib["RewardedAd"]["createForAdRequest"]> | null = null;
let rewardedLoaded = false;
let rewardEarned = false;
let rewardedDone: ((earned: boolean) => void) | null = null;

function finishRewarded(earned: boolean) {
  rewardedDone?.(earned);
  rewardedDone = null;
}

function loadRewarded() {
  const m = getAdsLib();
  if (!m || !ready) return;
  if (!rewarded) {
    rewarded = m.RewardedAd.createForAdRequest(AD_UNITS.rewarded);
    rewarded.addAdEventListener(m.RewardedAdEventType.LOADED, () => { rewardedLoaded = true; });
    // The ONLY place a reward is authorized: the SDK's EARNED_REWARD callback.
    rewarded.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => { rewardEarned = true; });
    rewarded.addAdEventListener(m.AdEventType.CLOSED, () => {
      rewardedLoaded = false;
      finishRewarded(rewardEarned);
      rewarded?.load();
    });
    rewarded.addAdEventListener(m.AdEventType.ERROR, () => {
      rewardedLoaded = false;
      finishRewarded(false);
    });
  }
  rewarded.load();
}

export const isRewardedReady = () => ready && rewardedLoaded;

/**
 * Shows the rewarded ad. Resolves:
 *  - "rewarded"    → AdMob confirmed the reward
 *  - "dismissed"   → closed early / failed: NO reward
 *  - "unavailable" → no ad loaded (Expo Go, web, no fill)
 */
export function showRewardedAd(): Promise<"rewarded" | "dismissed" | "unavailable"> {
  if (!rewarded || !rewardedLoaded) {
    loadRewarded();
    return Promise.resolve("unavailable");
  }
  rewardEarned = false;
  return new Promise((resolve) => {
    rewardedDone = (earned) => resolve(earned ? "rewarded" : "dismissed");
    rewarded!.show().catch(() => finishRewarded(false));
  });
}
