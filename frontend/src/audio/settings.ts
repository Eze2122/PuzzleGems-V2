import { loadSave, updateSave } from "@/src/storage/save";

// Audio preferences now live in the unified save (legacy "pg_audio_settings_v1" is migrated).
export type AudioSettings = { music: boolean; sfx: boolean };

export const defaultAudioSettings: AudioSettings = { music: true, sfx: true };

export async function loadAudioSettings(): Promise<AudioSettings> {
  const { music, sfx } = await loadSave();
  return { music, sfx };
}

export async function saveAudioSettings(settings: AudioSettings): Promise<void> {
  updateSave({ music: settings.music, sfx: settings.sfx });
}
