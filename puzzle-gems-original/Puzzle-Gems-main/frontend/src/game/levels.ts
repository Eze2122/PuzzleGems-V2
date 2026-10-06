export type GemColor = "ruby" | "emerald" | "sapphire" | "amethyst" | "topaz" | "aqua" | "coral";

export type GameLevel = {
  id: number;
  title: string;
  difficulty: string;
  par: number;
  tubes: GemColor[][];
};

// Curated, deterministic boards. Each color appears exactly four times and
// every board has two empty tubes for the player to work with.
export const LEVELS: GameLevel[] = [
  { id: 1, title: "Primer destello", difficulty: "Suave", par: 12, tubes: [["emerald", "emerald", "sapphire", "emerald"], ["ruby", "emerald", "ruby", "sapphire"], ["sapphire", "ruby", "sapphire", "ruby"], [], []] },
  { id: 2, title: "Brillo cruzado", difficulty: "Suave", par: 15, tubes: [["sapphire", "emerald", "sapphire", "sapphire"], ["ruby", "emerald", "ruby", "sapphire"], ["emerald", "ruby", "ruby", "emerald"], [], []] },
  { id: 3, title: "Veta lunar", difficulty: "Media", par: 20, tubes: [["ruby", "emerald", "ruby", "topaz"], ["emerald", "sapphire", "sapphire", "emerald"], ["topaz", "sapphire", "sapphire", "emerald"], ["ruby", "ruby", "topaz", "topaz"], [], []] },
  { id: 4, title: "Prisma oculto", difficulty: "Media", par: 23, tubes: [["ruby", "sapphire", "sapphire", "amethyst"], ["amethyst", "ruby", "sapphire", "sapphire"], ["ruby", "emerald", "ruby", "amethyst"], ["emerald", "amethyst", "emerald", "emerald"], [], []] },
  { id: 5, title: "Cámara solar", difficulty: "Media", par: 29, tubes: [["amethyst", "emerald", "ruby", "amethyst"], ["emerald", "sapphire", "ruby", "topaz"], ["ruby", "sapphire", "sapphire", "topaz"], ["emerald", "emerald", "topaz", "ruby"], ["amethyst", "topaz", "amethyst", "sapphire"], [], []] },
  { id: 6, title: "Constelación", difficulty: "Difícil", par: 34, tubes: [["ruby", "sapphire", "emerald", "topaz"], ["emerald", "emerald", "ruby", "sapphire"], ["amethyst", "ruby", "amethyst", "amethyst"], ["sapphire", "ruby", "topaz", "topaz"], ["sapphire", "emerald", "topaz", "amethyst"], [], []] },
  { id: 7, title: "Nexo violeta", difficulty: "Difícil", par: 42, tubes: [["emerald", "topaz", "aqua", "aqua"], ["sapphire", "ruby", "ruby", "emerald"], ["sapphire", "ruby", "emerald", "topaz"], ["ruby", "aqua", "amethyst", "amethyst"], ["aqua", "topaz", "sapphire", "amethyst"], ["sapphire", "emerald", "amethyst", "topaz"], [], []] },
  { id: 8, title: "Aurora mineral", difficulty: "Difícil", par: 46, tubes: [["topaz", "emerald", "amethyst", "ruby"], ["sapphire", "amethyst", "sapphire", "emerald"], ["aqua", "ruby", "topaz", "aqua"], ["aqua", "ruby", "emerald", "emerald"], ["sapphire", "sapphire", "aqua", "ruby"], ["amethyst", "topaz", "topaz", "amethyst"], [], []] },
  { id: 9, title: "Bóveda cristalina", difficulty: "Experta", par: 58, tubes: [["amethyst", "emerald", "topaz", "emerald"], ["amethyst", "emerald", "topaz", "ruby"], ["sapphire", "sapphire", "coral", "amethyst"], ["sapphire", "sapphire", "aqua", "emerald"], ["ruby", "coral", "coral", "ruby"], ["ruby", "topaz", "aqua", "aqua"], ["aqua", "topaz", "amethyst", "coral"], [], []] },
  { id: 10, title: "Gran orbe", difficulty: "Experta", par: 66, tubes: [["aqua", "sapphire", "topaz", "topaz"], ["amethyst", "ruby", "emerald", "amethyst"], ["emerald", "aqua", "sapphire", "ruby"], ["sapphire", "coral", "coral", "ruby"], ["amethyst", "sapphire", "topaz", "aqua"], ["emerald", "coral", "amethyst", "coral"], ["ruby", "topaz", "emerald", "aqua"], [], []] },
];

export const getLevel = (levelId: number) => LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];