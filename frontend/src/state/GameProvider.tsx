import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";

import { addLife, loseLife, LivesState, MAX_LIVES, msToNextLife, regenerate } from "@/src/game/lives";
import { TOTAL_LEVELS } from "@/src/game/levels";
import { CompletionResult, Progress, recordCompletion } from "@/src/storage/progress";
import { getSave, loadSave, PendingGame, updateSave } from "@/src/storage/save";

type GameValue = {
  loaded: boolean;
  progress: Progress;
  maxUnlocked: number;
  currentLevel: number;
  totalStars: number;
  lives: number;
  msToNextLife: number;
  pending: PendingGame | null;
  recordWin: (levelId: number, moves: number) => CompletionResult;
  consumeLife: () => void;
  grantLife: () => void;
  savePending: (pending: PendingGame) => void;
  clearPending: () => void;
};

const GameContext = createContext<GameValue | null>(null);

const livesOf = (): LivesState => {
  const s = getSave();
  return { lives: s.lives, regenStart: s.lifeRegenStart };
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState<Progress>({ completed: [], bestMoves: {}, stars: {} });
  const [currentLevel, setCurrentLevel] = useState(1);
  const [lives, setLives] = useState<LivesState>({ lives: MAX_LIVES, regenStart: null });
  const [pending, setPending] = useState<PendingGame | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const applyLives = useCallback((next: LivesState) => {
    const s = getSave();
    if (s.lives !== next.lives || s.lifeRegenStart !== next.regenStart) {
      updateSave({ lives: next.lives, lifeRegenStart: next.regenStart });
    }
    setLives(next);
  }, []);

  useEffect(() => {
    loadSave().then((s) => {
      setProgress({ completed: s.completed, bestMoves: s.bestMoves, stars: s.stars });
      setCurrentLevel(s.currentLevel);
      setPending(s.pending);
      applyLives(regenerate({ lives: s.lives, regenStart: s.lifeRegenStart }, Date.now()));
      setLoaded(true);
    });
  }, [applyLives]);

  // Recover lives over time (and immediately when the app returns to foreground).
  useEffect(() => {
    if (!loaded || lives.lives >= MAX_LIVES) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const next = regenerate(livesOf(), t);
      if (next.lives !== getSave().lives) applyLives(next);
    };
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener("change", (state) => { if (state === "active") tick(); });
    return () => { clearInterval(id); sub.remove(); };
  }, [loaded, lives.lives, applyLives]);

  const recordWin = useCallback((levelId: number, moves: number) => {
    const result = recordCompletion(levelId, moves);
    setProgress(result.progress);
    setCurrentLevel(getSave().currentLevel);
    setPending(null);
    return result;
  }, []);

  const consumeLife = useCallback(() => applyLives(loseLife(livesOf(), Date.now())), [applyLives]);
  const grantLife = useCallback(() => applyLives(addLife(livesOf(), Date.now())), [applyLives]);

  const savePending = useCallback((p: PendingGame) => {
    updateSave({ pending: p, currentLevel: p.levelId });
    setPending(p);
    setCurrentLevel(p.levelId);
  }, []);

  const clearPending = useCallback(() => {
    updateSave({ pending: null });
    setPending(null);
  }, []);

  const value = useMemo<GameValue>(() => {
    const maxDone = progress.completed.length ? Math.max(...progress.completed) : 0;
    const totalStars = Object.values(progress.stars).reduce((a, b) => a + b, 0);
    return {
      loaded, progress, currentLevel, totalStars, pending,
      maxUnlocked: Math.min(TOTAL_LEVELS, Math.max(1, maxDone + 1)),
      lives: lives.lives,
      msToNextLife: msToNextLife(lives, now),
      recordWin, consumeLife, grantLife, savePending, clearPending,
    };
  }, [loaded, progress, currentLevel, pending, lives, now, recordWin, consumeLife, grantLife, savePending, clearPending]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
