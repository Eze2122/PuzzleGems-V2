// Offline generator for Puzzle Gems levels.
// - Keeps the 10 original hand-made boards (tubes + par untouched).
// - Generates levels 11-100 with a seeded PRNG (deterministic output).
// - Every board is solved by src/game/solver.ts; the solution is stored so the
//   app can re-validate it at runtime with logic.ts.
// Run: node scripts/generate-levels.mjs   (Node >= 23, native TS type stripping)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { solve } from "../src/game/solver.ts";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "src", "game", "levels.data.json");
const CAP = 4;
const COLORS = ["ruby", "emerald", "sapphire", "amethyst", "topaz", "aqua", "coral", "rose", "lime", "moon"];

const MANUAL = [
  { par: 12, difficulty: "easy", tubes: [["emerald", "emerald", "sapphire", "emerald"], ["ruby", "emerald", "ruby", "sapphire"], ["sapphire", "ruby", "sapphire", "ruby"], [], []] },
  { par: 15, difficulty: "easy", tubes: [["sapphire", "emerald", "sapphire", "sapphire"], ["ruby", "emerald", "ruby", "sapphire"], ["emerald", "ruby", "ruby", "emerald"], [], []] },
  { par: 20, difficulty: "medium", tubes: [["ruby", "emerald", "ruby", "topaz"], ["emerald", "sapphire", "sapphire", "emerald"], ["topaz", "sapphire", "sapphire", "emerald"], ["ruby", "ruby", "topaz", "topaz"], [], []] },
  { par: 23, difficulty: "medium", tubes: [["ruby", "sapphire", "sapphire", "amethyst"], ["amethyst", "ruby", "sapphire", "sapphire"], ["ruby", "emerald", "ruby", "amethyst"], ["emerald", "amethyst", "emerald", "emerald"], [], []] },
  { par: 29, difficulty: "medium", tubes: [["amethyst", "emerald", "ruby", "amethyst"], ["emerald", "sapphire", "ruby", "topaz"], ["ruby", "sapphire", "sapphire", "topaz"], ["emerald", "emerald", "topaz", "ruby"], ["amethyst", "topaz", "amethyst", "sapphire"], [], []] },
  { par: 34, difficulty: "hard", tubes: [["ruby", "sapphire", "emerald", "topaz"], ["emerald", "emerald", "ruby", "sapphire"], ["amethyst", "ruby", "amethyst", "amethyst"], ["sapphire", "ruby", "topaz", "topaz"], ["sapphire", "emerald", "topaz", "amethyst"], [], []] },
  { par: 42, difficulty: "hard", tubes: [["emerald", "topaz", "aqua", "aqua"], ["sapphire", "ruby", "ruby", "emerald"], ["sapphire", "ruby", "emerald", "topaz"], ["ruby", "aqua", "amethyst", "amethyst"], ["aqua", "topaz", "sapphire", "amethyst"], ["sapphire", "emerald", "amethyst", "topaz"], [], []] },
  { par: 46, difficulty: "hard", tubes: [["topaz", "emerald", "amethyst", "ruby"], ["sapphire", "amethyst", "sapphire", "emerald"], ["aqua", "ruby", "topaz", "aqua"], ["aqua", "ruby", "emerald", "emerald"], ["sapphire", "sapphire", "aqua", "ruby"], ["amethyst", "topaz", "topaz", "amethyst"], [], []] },
  { par: 58, difficulty: "expert", tubes: [["amethyst", "emerald", "topaz", "emerald"], ["amethyst", "emerald", "topaz", "ruby"], ["sapphire", "sapphire", "coral", "amethyst"], ["sapphire", "sapphire", "aqua", "emerald"], ["ruby", "coral", "coral", "ruby"], ["ruby", "topaz", "aqua", "aqua"], ["aqua", "topaz", "amethyst", "coral"], [], []] },
  { par: 66, difficulty: "expert", tubes: [["aqua", "sapphire", "topaz", "topaz"], ["amethyst", "ruby", "emerald", "amethyst"], ["emerald", "aqua", "sapphire", "ruby"], ["sapphire", "coral", "coral", "ruby"], ["amethyst", "sapphire", "topaz", "aqua"], ["emerald", "coral", "amethyst", "coral"], ["ruby", "topaz", "emerald", "aqua"], [], []] },
];

// Progressive difficulty plan for levels 11-100.
function plan(id) {
  if (id <= 20) return { colors: id <= 15 ? 5 : 6, difficulty: "medium", noAdjacent: false };
  if (id <= 40) return { colors: id <= 30 ? 6 : 7, difficulty: "hard", noAdjacent: id > 30 };
  if (id <= 60) return { colors: 7, difficulty: "hard", noAdjacent: true };
  if (id <= 80) return { colors: 8, difficulty: "advanced", noAdjacent: true };
  return { colors: 9, difficulty: "expert", noAdjacent: true };
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function board(rand, nColors, noAdjacent) {
  // rotate the palette so colors vary between levels
  const offset = Math.floor(rand() * COLORS.length);
  const palette = Array.from({ length: nColors }, (_, i) => COLORS[(i + offset) % COLORS.length]);
  for (let attempt = 0; attempt < 500; attempt++) {
    const gems = palette.flatMap((c) => [c, c, c, c]);
    for (let i = gems.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [gems[i], gems[j]] = [gems[j], gems[i]];
    }
    const tubes = Array.from({ length: nColors }, (_, i) => gems.slice(i * CAP, i * CAP + CAP));
    const tooEasy = tubes.some((t) => new Set(t).size <= (noAdjacent ? 2 : 1));
    const adjacent = tubes.some((t) => t.some((g, i) => i > 0 && g === t[i - 1]));
    if (tooEasy || (noAdjacent && adjacent)) continue;
    return [...tubes, [], []];
  }
  throw new Error("could not build board");
}

const replay = (tubes, solution) => {
  const b = tubes.map((t) => [...t]);
  for (const [f, t] of solution) {
    const top = b[t][b[t].length - 1];
    if (!b[f].length || b[t].length >= CAP || (top && top !== b[f][b[f].length - 1])) return false;
    b[t].push(b[f].pop());
  }
  return b.every((t) => t.length === 0 || (t.length === CAP && t.every((g) => g === t[0])));
};

const levels = [];
MANUAL.forEach((m, i) => {
  const solution = solve(m.tubes, CAP, 400000);
  if (!solution || !replay(m.tubes, solution)) throw new Error(`manual level ${i + 1} unsolved`);
  levels.push({ id: i + 1, difficulty: m.difficulty, par: m.par, tubes: m.tubes, solution });
});

for (let id = 11; id <= 100; id++) {
  const p = plan(id);
  const rand = rng(id * 7919 + 17);
  const candidates = [];
  let tries = 0;
  while (candidates.length < 5 && tries < 60) {
    tries++;
    const tubes = board(rand, p.colors, p.noAdjacent);
    const solution = solve(tubes, CAP, 300000);
    if (solution && replay(tubes, solution)) candidates.push({ tubes, solution });
  }
  if (!candidates.length) throw new Error(`level ${id}: no solvable candidate`);
  candidates.sort((a, b) => a.solution.length - b.solution.length);
  // within a tier, later levels pick longer (harder) solutions
  const t = ((id - 1) % 10) / 9;
  const pick = candidates[Math.round(t * (candidates.length - 1))];
  const prevPar = levels[levels.length - 1].par;
  levels.push({ id, difficulty: p.difficulty, par: pick.solution.length, tubes: pick.tubes, solution: pick.solution });
  process.stdout.write(`L${id}:${p.colors}c par ${pick.solution.length} (prev ${prevPar})  `);
}

writeFileSync(OUT, JSON.stringify(levels));
console.log(`\nwrote ${levels.length} levels -> ${OUT}`);
