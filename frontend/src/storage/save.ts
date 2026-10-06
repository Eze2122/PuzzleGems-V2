import { storage } from "@/src/utils/storage";
import { getLevel, LEVELS, starsFor } from "@/src/game/levels";
import { MAX_LIVES } from "@/src/game/lives";
import type { Tubes } from "@/src/game/logic";

/**
 * Single, unified save for Puzzle Gems.
 * Legacy keys from the original app are migrated (never deleted):
 *  - "jewel-sort-puzzle-progress-v1" -> completed + bestMoves
 *  - "pg_audio_settings_v1"          -> music + sfx
 */
export type Language = "es" | "en";
export type PendingGame = { levelId: number; tubes: Tubes; history: Tubes[]; moves: number };

export type SaveData = {
  version: 2;
  completed: number[];
  bestMoves: Record<string, number>;
  stars: Record<string, number>;
  currentLevel: number;
  pending: PendingGame | null;
  lives: number;
  lifeRegenStart: number | null;
  language: Language | null;
  music: boolean;
  sfx: boolean;
  levelsSinceAd: number;
};

const KEY = "pg_save_v2";
const LEGACY_PROGRESS = "jewel-sort-puzzle-progress-v1";
const LEGACY_AUDIO = "pg_audio_settings_v1";

export const defaultSave: SaveData = {
  version: 2, completed: [], bestMoves: {}, stars: {}, currentLevel: 1, pending: null,
  lives: MAX_LIVES, lifeRegenStart: null, language: null, music: true, sfx: true, levelsSinceAd: 0,
};

let cache: SaveData | null = null;
let loading: Promise<SaveData> | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

// storage.getItem JSON-parses once; legacy values may be an object or a JSON string.
const asObject = (raw: unknown): Record<string, any> | null => {
  if (raw == null || raw === "") return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return typeof raw === "object" ? (raw as Record<string, any>) : null;
};

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function sanitize(raw: Record<string, any>): SaveData {
  const completed = Array.isArray(raw.completed) ? raw.completed.filter(isNum) : [];
  const bestMoves: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.bestMoves ?? {})) if (isNum(v)) bestMoves[k] = v;
  const stars: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw.stars ?? {})) if (isNum(v)) stars[k] = v;
  // derive stars for completed levels that have none (legacy data)
  for (const id of completed) {
    if (!stars[String(id)] && bestMoves[String(id)]) stars[String(id)] = starsFor(bestMoves[String(id)], getLevel(id).par);
  }
  const maxDone = completed.length ? Math.max(...completed) : 0;
  const pending = raw.pending && isNum(raw.pending.levelId) && Array.isArray(raw.pending.tubes) ? (raw.pending as PendingGame) : null;
  return {
    version: 2,
    completed,
    bestMoves,
    stars,
    currentLevel: isNum(raw.currentLevel) ? raw.currentLevel : Math.min(LEVELS.length, maxDone + 1),
    pending,
    lives: isNum(raw.lives) ? Math.max(0, Math.min(MAX_LIVES, raw.lives)) : MAX_LIVES,
    lifeRegenStart: isNum(raw.lifeRegenStart) ? raw.lifeRegenStart : null,
    language: raw.language === "es" || raw.language === "en" ? raw.language : null,
    music: typeof raw.music === "boolean" ? raw.music : true,
    sfx: typeof raw.sfx === "boolean" ? raw.sfx : true,
    levelsSinceAd: isNum(raw.levelsSinceAd) ? raw.levelsSinceAd : 0,
  };
}

async function readFromDisk(): Promise<SaveData> {
  const current = asObject(await storage.getItem<string>(KEY, ""));
  if (current) return sanitize(current);
  // First launch of the new version: migrate legacy data.
  const legacyProgress = asObject(await storage.getItem<string>(LEGACY_PROGRESS, "")) ?? {};
  const legacyAudio = asObject(await storage.getItem<string>(LEGACY_AUDIO, "")) ?? {};
  const migrated = sanitize({ ...legacyProgress, music: legacyAudio.music, sfx: legacyAudio.sfx });
  await storage.setItem(KEY, JSON.stringify(migrated));
  return migrated;
}

export function loadSave(): Promise<SaveData> {
  if (cache) return Promise.resolve(cache);
  if (!loading) loading = readFromDisk().then((data) => (cache = data));
  return loading;
}

export function getSave(): SaveData {
  return cache ?? defaultSave;
}

/** Updates the in-memory save and persists it (writes are serialized). */
export function updateSave(patch: Partial<SaveData> | ((current: SaveData) => Partial<SaveData>)): SaveData {
  const base = cache ?? defaultSave;
  const next = { ...base, ...(typeof patch === "function" ? patch(base) : patch) };
  cache = next;
  const snapshot = JSON.stringify(next);
  writeChain = writeChain.then(() => storage.setItem(KEY, snapshot));
  return next;
}
