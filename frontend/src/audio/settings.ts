import { storage } from "@/src/utils/storage";

const KEY = "pg_audio_settings_v1";

export type AudioSettings = { music: boolean; sfx: boolean };

export const defaultAudioSettings: AudioSettings = { music: true, sfx: true };

export async function loadAudioSettings(): Promise<AudioSettings> {
  const stored = await storage.getItem<string>(KEY, "");
  if (!stored) return defaultAudioSettings;
  try {
    const parsed = JSON.parse(stored) as Partial<AudioSettings>;
    return {
      music: typeof parsed.music === "boolean" ? parsed.music : true,
      sfx: typeof parsed.sfx === "boolean" ? parsed.sfx : true,
    };
  } catch {
    return defaultAudioSettings;
  }
}

export async function saveAudioSettings(settings: AudioSettings): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(settings));
}
