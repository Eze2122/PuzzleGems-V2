import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Language, loadSave, updateSave } from "@/src/storage/save";

const es = {
  "app.name": "Puzzle Gems",
  "app.by": "by Ezequiel",
  "app.loading": "Preparando tus gemas…",
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "nav.home": "Inicio",
  "nav.levels": "Niveles",
  "nav.settings": "Ajustes",
  "home.play": "Jugar",
  "home.continue": "Continuar",
  "home.restartPending": "Reiniciar nivel",
  "home.levels": "Ver niveles",
  "home.levelN": "Nivel {n}",
  "home.pending": "Partida sin terminar · {moves} mov.",
  "home.progressTitle": "Tu progreso",
  "home.progress": "{done} de {total} niveles",
  "home.allDone": "¡Completaste todos los niveles!",
  "home.tip": "Deja siempre un tubo libre para respirar.",
  "levels.kicker": "SALA DE GEMAS",
  "levels.title": "Ordena el brillo.",
  "levels.hint": "Cada cristal encuentra su lugar.",
  "levels.range": "Niveles {from}–{to}",
  "levels.lockedA11y": "Nivel {n} bloqueado",
  "levels.a11y": "Nivel {n}, {stars} estrellas",
  "world.0": "Pradera de Cristal",
  "world.1": "Bosque Brillante",
  "world.2": "Cueva Prisma",
  "world.3": "Cumbres Aurora",
  "world.4": "Palacio Estelar",
  "difficulty.easy": "Suave",
  "difficulty.medium": "Media",
  "difficulty.hard": "Difícil",
  "difficulty.advanced": "Avanzada",
  "difficulty.expert": "Experta",
  "level.1": "Primer destello",
  "level.2": "Brillo cruzado",
  "level.3": "Veta lunar",
  "level.4": "Prisma oculto",
  "level.5": "Cámara solar",
  "level.6": "Constelación",
  "level.7": "Nexo violeta",
  "level.8": "Aurora mineral",
  "level.9": "Bóveda cristalina",
  "level.10": "Gran orbe",
  "game.level": "NIVEL {n}",
  "game.moves": "Movimientos",
  "game.goal": "Objetivo",
  "game.colors": "Colores",
  "game.undo": "Deshacer",
  "game.restart": "Reiniciar",
  "game.back": "Volver",
  "game.hintStart": "Toca un tubo para elegir una gema",
  "game.hintPlace": "Elige dónde colocarla",
  "game.tube": "Tubo {n}, {count} gemas",
  "restart.title": "¿Reiniciar nivel?",
  "restart.body": "Perderás el progreso de este intento. Reiniciar no gasta vidas.",
  "restart.confirm": "Reiniciar",
  "fail.title": "¡Sin movimientos!",
  "fail.body": "No quedan jugadas posibles. Has perdido 1 vida.",
  "fail.retry": "Reintentar",
  "fail.levels": "Volver a niveles",
  "lives.title": "Vidas",
  "lives.full": "¡Vidas completas!",
  "lives.next": "Siguiente vida en {time}",
  "lives.rule": "Recuperas 1 vida cada 30 minutos (máximo 5).",
  "lives.noneTitle": "Te quedaste sin vidas",
  "lives.watchAd": "Ver anuncio · +1 vida",
  "lives.adUnavailable": "Anuncio no disponible ahora. Inténtalo más tarde.",
  "lives.adDismissed": "Anuncio no completado: sin recompensa.",
  "lives.gained": "¡+1 vida!",
  "lives.a11y": "{n} vidas",
  "victory.kicker": "¡DESTELLO CONSEGUIDO!",
  "victory.title": "¡Nivel completado!",
  "victory.body": "Todas las gemas encontraron su hogar.",
  "victory.moves": "Movimientos",
  "victory.best": "Mejor",
  "victory.stars": "Brillo",
  "victory.newBest": "¡Nuevo récord!",
  "victory.next": "Siguiente nivel",
  "victory.levels": "Volver a niveles",
  "victory.allDone": "¡Completaste los {total} niveles!",
  "settings.title": "Ajustes",
  "settings.language": "Idioma",
  "settings.audio": "Sonido",
  "settings.music": "Música",
  "settings.sfx": "Efectos de sonido",
  "settings.privacy": "Privacidad y anuncios",
  "settings.privacyBtn": "Opciones de privacidad",
  "settings.privacyUnavailable": "Disponible en la app instalada (build nativa).",
  "settings.about": "Acerca de",
  "settings.version": "Versión {v}",
  "settings.on": "Activado",
  "settings.off": "Desactivado",
};

type Key = keyof typeof es;

const en: Record<Key, string> = {
  "app.name": "Puzzle Gems",
  "app.by": "by Ezequiel",
  "app.loading": "Polishing your gems…",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "nav.home": "Home",
  "nav.levels": "Levels",
  "nav.settings": "Settings",
  "home.play": "Play",
  "home.continue": "Continue",
  "home.restartPending": "Restart level",
  "home.levels": "View levels",
  "home.levelN": "Level {n}",
  "home.pending": "Unfinished game · {moves} moves",
  "home.progressTitle": "Your progress",
  "home.progress": "{done} of {total} levels",
  "home.allDone": "You completed every level!",
  "home.tip": "Always keep a free tube to breathe.",
  "levels.kicker": "GEM HALL",
  "levels.title": "Sort the sparkle.",
  "levels.hint": "Every crystal finds its place.",
  "levels.range": "Levels {from}–{to}",
  "levels.lockedA11y": "Level {n} locked",
  "levels.a11y": "Level {n}, {stars} stars",
  "world.0": "Crystal Meadow",
  "world.1": "Shimmer Woods",
  "world.2": "Prism Cave",
  "world.3": "Aurora Peaks",
  "world.4": "Star Palace",
  "difficulty.easy": "Easy",
  "difficulty.medium": "Medium",
  "difficulty.hard": "Hard",
  "difficulty.advanced": "Advanced",
  "difficulty.expert": "Expert",
  "level.1": "First Sparkle",
  "level.2": "Crossed Shine",
  "level.3": "Moon Vein",
  "level.4": "Hidden Prism",
  "level.5": "Solar Chamber",
  "level.6": "Constellation",
  "level.7": "Violet Nexus",
  "level.8": "Mineral Aurora",
  "level.9": "Crystal Vault",
  "level.10": "Great Orb",
  "game.level": "LEVEL {n}",
  "game.moves": "Moves",
  "game.goal": "Goal",
  "game.colors": "Colors",
  "game.undo": "Undo",
  "game.restart": "Restart",
  "game.back": "Back",
  "game.hintStart": "Tap a tube to pick a gem",
  "game.hintPlace": "Choose where to place it",
  "game.tube": "Tube {n}, {count} gems",
  "restart.title": "Restart level?",
  "restart.body": "You'll lose this attempt's progress. Restarting never costs lives.",
  "restart.confirm": "Restart",
  "fail.title": "Out of moves!",
  "fail.body": "No moves left. You lost 1 life.",
  "fail.retry": "Try again",
  "fail.levels": "Back to levels",
  "lives.title": "Lives",
  "lives.full": "Lives are full!",
  "lives.next": "Next life in {time}",
  "lives.rule": "You recover 1 life every 30 minutes (max 5).",
  "lives.noneTitle": "You're out of lives",
  "lives.watchAd": "Watch ad · +1 life",
  "lives.adUnavailable": "Ad not available right now. Try again later.",
  "lives.adDismissed": "Ad not completed: no reward.",
  "lives.gained": "+1 life!",
  "lives.a11y": "{n} lives",
  "victory.kicker": "SPARKLE ACHIEVED!",
  "victory.title": "Level complete!",
  "victory.body": "Every gem found its home.",
  "victory.moves": "Moves",
  "victory.best": "Best",
  "victory.stars": "Shine",
  "victory.newBest": "New best!",
  "victory.next": "Next level",
  "victory.levels": "Back to levels",
  "victory.allDone": "You completed all {total} levels!",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.audio": "Sound",
  "settings.music": "Music",
  "settings.sfx": "Sound effects",
  "settings.privacy": "Privacy & ads",
  "settings.privacyBtn": "Privacy options",
  "settings.privacyUnavailable": "Available in the installed app (native build).",
  "settings.about": "About",
  "settings.version": "Version {v}",
  "settings.on": "On",
  "settings.off": "Off",
};

const DICTS: Record<Language, Record<Key, string>> = { es, en };
export type TKey = Key;
export type TFunction = (key: Key, params?: Record<string, string | number>) => string;

function deviceLanguage(): Language {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith("es") ? "es" : "en";
  } catch {
    return "es";
  }
}

type I18nValue = { language: Language; setLanguage: (l: Language) => void; t: TFunction; ready: boolean };
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSave().then((s) => {
      setLang(s.language ?? deviceLanguage());
      setReady(true);
    });
  }, []);

  const setLanguage = useCallback((l: Language) => {
    setLang(l);
    updateSave({ language: l });
  }, []);

  const t = useCallback<TFunction>((key, params) => {
    let text = DICTS[language][key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, String(v));
    return text;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t, ready }), [language, setLanguage, t, ready]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Translated level name: originals 1-10 keep their names; the rest use the world name. */
export function levelName(t: TFunction, id: number): string {
  if (id <= 10) return t(`level.${id}` as Key);
  return t(`world.${Math.min(4, Math.floor((id - 1) / 20))}` as Key);
}
