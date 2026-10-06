export const MAX_LIVES = 5;
export const REGEN_MS = 30 * 60 * 1000;

export type LivesState = { lives: number; regenStart: number | null };

/** Applies every life recovered since `regenStart` (works across app restarts). */
export function regenerate(state: LivesState, now: number): LivesState {
  const lives = Math.max(0, Math.min(MAX_LIVES, state.lives));
  if (lives >= MAX_LIVES) return { lives: MAX_LIVES, regenStart: null };
  // Missing or future timestamp (clock changed): restart the countdown now.
  if (state.regenStart == null || state.regenStart > now) return { lives, regenStart: now };
  const gained = Math.floor((now - state.regenStart) / REGEN_MS);
  if (gained <= 0) return { lives, regenStart: state.regenStart };
  const next = Math.min(MAX_LIVES, lives + gained);
  return next >= MAX_LIVES
    ? { lives: MAX_LIVES, regenStart: null }
    : { lives: next, regenStart: state.regenStart + gained * REGEN_MS };
}

export function loseLife(state: LivesState, now: number): LivesState {
  const current = regenerate(state, now);
  return { lives: Math.max(0, current.lives - 1), regenStart: current.regenStart ?? now };
}

export function addLife(state: LivesState, now: number): LivesState {
  const current = regenerate(state, now);
  const lives = Math.min(MAX_LIVES, current.lives + 1);
  return { lives, regenStart: lives >= MAX_LIVES ? null : current.regenStart };
}

export function msToNextLife(state: LivesState, now: number): number {
  if (state.lives >= MAX_LIVES || state.regenStart == null) return 0;
  return Math.max(0, state.regenStart + REGEN_MS - now);
}

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
