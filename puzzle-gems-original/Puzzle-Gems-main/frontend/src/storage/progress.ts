import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "jewel-sort-puzzle-progress-v1";

export type Progress = {
  completed: number[];
  bestMoves: Record<string, number>;
};

export const emptyProgress: Progress = { completed: [], bestMoves: {} };

export async function loadProgress(): Promise<Progress> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyProgress;
    const parsed = JSON.parse(stored) as Partial<Progress>;
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      bestMoves: parsed.bestMoves ?? {},
    };
  } catch {
    return emptyProgress;
  }
}

export async function saveProgress(progress: Progress) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function recordCompletion(levelId: number, moves: number) {
  const progress = await loadProgress();
  const completed = progress.completed.includes(levelId)
    ? progress.completed
    : [...progress.completed, levelId].sort((a, b) => a - b);
  const currentBest = progress.bestMoves[String(levelId)];
  const bestMoves = currentBest && currentBest <= moves
    ? progress.bestMoves
    : { ...progress.bestMoves, [String(levelId)]: moves };
  const next = { completed, bestMoves };
  await saveProgress(next);
  return next;
}