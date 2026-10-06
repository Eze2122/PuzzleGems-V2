import { GemColor } from "./levels";

export const TUBE_CAPACITY = 4;
export type Tubes = GemColor[][];

export const cloneTubes = (tubes: Tubes): Tubes => tubes.map((tube) => [...tube]);

export const canMoveGem = (tubes: Tubes, from: number, to: number) => {
  if (from === to || !tubes[from]?.length || tubes[to]?.length >= TUBE_CAPACITY) return false;
  const target = tubes[to]?.[tubes[to].length - 1];
  return !target || target === tubes[from][tubes[from].length - 1];
};

export const moveGem = (tubes: Tubes, from: number, to: number): Tubes => {
  const next = cloneTubes(tubes);
  const gem = next[from].pop();
  if (gem) next[to].push(gem);
  return next;
};

export const isTubeComplete = (tube: GemColor[]) =>
  tube.length === TUBE_CAPACITY && tube.every((gem) => gem === tube[0]);

export const isPuzzleComplete = (tubes: Tubes) =>
  tubes.every((tube) => tube.length === 0 || isTubeComplete(tube));