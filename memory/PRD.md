# PRD — Puzzle Gems (evolución del proyecto original "Jewel Sort")

## Problema original
Evolucionar el juego Expo existente (ordenar gemas en tubos) a "Puzzle Gems" sin reconstruirlo: conservar logic.ts, niveles originales, undo/restart, progreso, audio, Package ID `com.emergent.puzzlegems.ozxnol`. Original intacto en `/app/puzzle-gems-original/`.

## Arquitectura (Expo SDK 57, expo-router)
- Pantallas: `app/index.tsx` (splash animado con el póster aprobado), `home.tsx`, `levels.tsx`, `game.tsx` (+VictoryModal), `settings.tsx`.
- Lógica: `src/game/logic.ts` (sin cambios), `levels.ts` (100 niveles + validación replay con logic.ts), `levels.data.json`, `solver.ts`, `lives.ts`.
- Estado/persistencia: `src/state/GameProvider.tsx`, `src/storage/save.ts` (clave única `pg_save_v2`, migra `jewel-sort-puzzle-progress-v1` y `pg_audio_settings_v1`), `progress.ts`, `audio/settings.ts`.
- i18n: `src/i18n/index.tsx` (ES/EN).
- Audio: `AudioProvider.tsx` con 5 pistas mp3 (A–E por cada 20 niveles), move/win originales.
- Ads: `src/ads/config.ts` (IDs de prueba), `index.ts` (nativo, UMP + interstitial + rewarded), `index.web.ts` (no-op), `AdBanner(.web).tsx`.
- Scripts: `scripts/generate-levels.mjs`, `scripts/make-music.py`.

## Implementado — 2026-06
- Rediseño 3D pastel según referencias; icono = REFERENCIA_ICONO; splash = SPLASH_REFERENCIA.
- 100 niveles verificados (1-10 originales), dificultad progresiva 3→9 colores.
- Vidas (5, -1 al quedarse sin movimientos, +1 cada 30 min, persistentes), partida pendiente Continuar/Reiniciar, victoria con estrellas/récord, idiomas, música rotativa, AdMob estructurado, fixes base (botón nivel final, /10, Alert, iconos migrados a @react-native-vector-icons, lint).
- Testing: iteration_2 13/13 flujos OK (web).

## Pendiente / Backlog
- P0 antes del APK: IDs reales AdMob (config.ts + app.json), política de privacidad, probar ads/UMP en build nativa.
- P1: tutorial nivel 1, pistas con anuncio recompensado, más pulido de animaciones de movimiento.
- P2: logros, temas desbloqueables, tienda.
