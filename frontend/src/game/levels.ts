import data from "./levels.data.json";
import { canMoveGem, isPuzzleComplete, moveGem, TUBE_CAPACITY, Tubes } from "./logic";

export type GemColor =
  | "ruby" | "emerald" | "sapphire" | "amethyst" | "topaz" | "aqua" | "coral" | "rose" | "lime" | "moon";

export type Difficulty = "easy" | "medium" | "hard" | "advanced" | "expert";

export type GameLevel = {
  id: number;
  difficulty: Difficulty;
  par: number;
  tubes: GemColor[][];
  /** Verified solution (from, to) moves produced by scripts/generate-levels.mjs */
  solution: [number, number][];
};

// Levels 1-10 are the original hand-made boards (tubes + par unchanged).
// Levels 11-100 are generated offline with a seeded generator and solver.
// Regenerate with: node scripts/generate-levels.mjs

/** Structural checks + replay of the stored solution using the game's own rules (logic.ts). */
export function validateLevel(level: GameLevel): boolean {
  const counts: Record<string, number> = {};
  for (const tube of level.tubes) {
    if (tube.length > TUBE_CAPACITY) return false;
    for (const gem of tube) counts[gem] = (counts[gem] ?? 0) + 1;
  }
  if (!Object.values(counts).every((n) => n === TUBE_CAPACITY)) return false;
  if (!level.tubes.some((tube) => tube.length === 0)) return false;
  let tubes: Tubes = level.tubes.map((tube) => [...tube]);
  for (const [from, to] of level.solution) {
    if (!canMoveGem(tubes, from, to)) return false;
    tubes = moveGem(tubes, from, to);
  }
  return isPuzzleComplete(tubes);
}

export const LEVELS: GameLevel[] = (data as unknown as GameLevel[]).filter((level) => {
  const ok = validateLevel(level);
  if (!ok) console.error(`[levels] level ${level.id} failed validation and was skipped`);
  return ok;
});

export const TOTAL_LEVELS = LEVELS.length;

export const getLevel = (levelId: number) => LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];

export const colorCount = (level: GameLevel) => new Set(level.tubes.flat()).size;

/** 3 stars at or under par, 2 stars up to +50%, otherwise 1. */
export const starsFor = (moves: number, par: number) => (moves <= par ? 3 : moves <= Math.ceil(par * 1.5) ? 2 : 1);

/** World / music group: 0 = 1-20, 1 = 21-40, ... 4 = 81-100 */
export const worldFor = (levelId: number) => Math.min(4, Math.floor((levelId - 1) / 20));

/** True when the player has at least one legal move left. */
export const hasAnyMove = (tubes: Tubes) =>
  tubes.some((_, from) => tubes.some((__, to) => canMoveGem(tubes, from, to)));
