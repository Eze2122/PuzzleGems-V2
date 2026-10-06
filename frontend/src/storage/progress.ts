import { getLevel, starsFor, TOTAL_LEVELS } from "@/src/game/levels";
import { loadSave, updateSave } from "@/src/storage/save";

// Progress API kept from the original app; now backed by the unified save (save.ts).
export type Progress = {
  completed: number[];
  bestMoves: Record<string, number>;
  stars: Record<string, number>;
};

export const emptyProgress: Progress = { completed: [], bestMoves: {}, stars: {} };

export async function loadProgress(): Promise<Progress> {
  const { completed, bestMoves, stars } = await loadSave();
  return { completed, bestMoves, stars };
}

export type CompletionResult = { progress: Progress; stars: number; best: number; isNewBest: boolean };

export function recordCompletion(levelId: number, moves: number): CompletionResult {
  const stars = starsFor(moves, getLevel(levelId).par);
  let result: CompletionResult | null = null;
  updateSave((save) => {
    const key = String(levelId);
    const completed = save.completed.includes(levelId)
      ? save.completed
      : [...save.completed, levelId].sort((a, b) => a - b);
    const currentBest = save.bestMoves[key];
    const isNewBest = !currentBest || moves < currentBest;
    const bestMoves = isNewBest ? { ...save.bestMoves, [key]: moves } : save.bestMoves;
    const starMap = { ...save.stars, [key]: Math.max(save.stars[key] ?? 0, stars) };
    result = { progress: { completed, bestMoves, stars: starMap }, stars, best: bestMoves[key], isNewBest };
    return {
      completed, bestMoves, stars: starMap, pending: null,
      currentLevel: Math.min(TOTAL_LEVELS, Math.max(save.currentLevel, levelId + 1)),
    };
  });
  return result as unknown as CompletionResult;
}
