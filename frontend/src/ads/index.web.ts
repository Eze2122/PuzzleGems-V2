// Web preview: AdMob has no web SDK. Same API as index.ts, all no-ops.
import { updateSave } from "@/src/storage/save";

export const getAdsLib = () => null;
export const isAdsReady = () => false;
export const onAdsReady = (_cb: (ready: boolean) => void) => () => {};
export const initAds = async () => {};
export const showPrivacyOptions = async () => false;
export const registerLevelCompleted = () => {
  updateSave((s) => ({ levelsSinceAd: s.levelsSinceAd + 1 }));
};
export const maybeShowInterstitial = async () => {};
export const isRewardedReady = () => false;
export const showRewardedAd = async (): Promise<"rewarded" | "dismissed" | "unavailable"> => "unavailable";
