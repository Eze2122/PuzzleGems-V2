// Pure, dependency-free solver used by the offline level generator
// (scripts/generate-levels.mjs). Same rules as logic.ts: one gem per move,
// onto an empty tube or a tube whose top gem has the same color.
// Kept free of imports so Node can run it directly (type stripping).

export type Board = string[][];
export type Move = [number, number];

const key = (b: Board) => b.map((t) => t.join(",")).sort().join("|");

const done = (b: Board, cap: number) =>
  b.every((t) => t.length === 0 || (t.length === cap && t.every((g) => g === t[0])));

const canMove = (b: Board, f: number, t: number, cap: number) => {
  if (f === t || !b[f].length || b[t].length >= cap) return false;
  const top = b[t][b[t].length - 1];
  return !top || top === b[f][b[f].length - 1];
};

// Heuristic: number of color breaks + gems sitting above a wrong base.
const score = (b: Board) => {
  let s = 0;
  for (const t of b) {
    for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) s += 1;
  }
  return s;
};

/** Best-first search. Returns a move list or null if not found within the node budget. */
export function solve(start: Board, cap = 4, budget = 200000): Move[] | null {
  type Node = { b: Board; path: Move[]; f: number };
  const seen = new Set<string>([key(start)]);
  let open: Node[] = [{ b: start, path: [], f: score(start) }];
  let expanded = 0;
  while (open.length && expanded < budget) {
    // pop lowest f (small arrays: linear scan is fine)
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const node = open[bi];
    open[bi] = open[open.length - 1];
    open.pop();
    expanded++;
    if (done(node.b, cap)) return node.path;
    for (let f = 0; f < node.b.length; f++) {
      const src = node.b[f];
      if (!src.length) continue;
      // skip moving out of an already-finished tube
      if (src.length === cap && src.every((g) => g === src[0])) continue;
      let movedToEmpty = false;
      for (let t = 0; t < node.b.length; t++) {
        if (!canMove(node.b, f, t, cap)) continue;
        if (!node.b[t].length) {
          // all empty tubes are equivalent; also pointless to move a uniform tube to empty
          if (movedToEmpty || src.every((g) => g === src[0])) continue;
          movedToEmpty = true;
        }
        const next = node.b.map((x) => [...x]);
        next[t].push(next[f].pop() as string);
        const k = key(next);
        if (seen.has(k)) continue;
        seen.add(k);
        const path: Move[] = [...node.path, [f, t]];
        open.push({ b: next, path, f: score(next) * 2 + path.length * 0.35 });
      }
    }
    if (open.length > 60000) open = open.sort((a, c) => a.f - c.f).slice(0, 30000);
  }
  return null;
}
