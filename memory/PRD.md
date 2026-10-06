# PRD — Puzzle Gems (evolución del proyecto existente)

## Problema original
Importar, descomprimir y analizar el proyecto existente "Puzzle Gems" (Expo + React Native, juego de ordenar gemas en tubos) SIN reconstruirlo. Conservar mecánica, niveles, undo, reinicio, persistencia, mejores movimientos, audio, config Expo/Android y Package ID. Próximos pasos del usuario: rediseño visual, 100 niveles, vidas, idiomas, música y AdMob.

## Paso 1 — Importación y análisis (2026-06)
- ZIP original intacto en `/app/puzzle-gems-original/Puzzle-Gems-main`.
- Copiado tal cual a `/app/frontend` (app/, src/, assets/, constants/, app.json original con package `com.emergent.puzzlegems.ozxnol`). Instalados `expo-audio` y `@expo/vector-icons` (ya los usaba).
- TypeScript: 0 errores. Preview web: compila y abre. Testing: 9/9 flujos OK (movimientos, inválidos, undo, victoria, desbloqueo, persistencia, toggles de audio).

## Arquitectura existente
- `app/index.tsx`: pantalla única con estado `levels | game` (sin rutas separadas), modal de victoria.
- `src/game/logic.ts`: TUBE_CAPACITY=4, canMoveGem, moveGem, isPuzzleComplete (reutilizable 100%).
- `src/game/levels.ts`: 10 niveles manuales, 7 colores, 2 tubos vacíos, `par`.
- `src/storage/progress.ts`: AsyncStorage directo, clave `jewel-sort-puzzle-progress-v1` {completed, bestMoves}.
- `src/audio/AudioProvider.tsx` + `settings.ts`: expo-audio, music/move/win.wav, clave `pg_audio_settings_v1`.
- Componentes: Gem, Tube, LevelCard, AmbientBackground, Sparkles. Backend no usado.

## Problemas detectados (pendientes)
- Botón de victoria en nivel final no hace nada (`goToLevels` sin invocar, index.tsx:385).
- "/10" y textos hardcodeados en español (bloquea i18n).
- Nombre visible "Jewel Sort" vs "Puzzle Gems"; slug/scheme `jewel-sort-puzzle`.
- `Alert.alert` para reiniciar (no funciona en web; reemplazar por bottom sheet).
- `@expo/vector-icons` deprecado → migrar a `@react-native-vector-icons`.
- Lint (React Compiler): mutación de players en AudioProvider; redeclaración en Sparkles.
- Mezcla de AsyncStorage directo y `@/src/utils/storage`.
- AdMob requiere build nativo (no funciona en Expo Go).
- music.wav 1 MB (convertir a m4a/mp3 al añadir más pistas).

## Backlog
- P0: rediseño visual, 100 niveles (generador/validador resoluble), vidas, i18n, AdMob.
- P1: división en rutas (home/levels/game/settings), fix bugs anteriores.
- P2: tienda, logros, tutorial.
