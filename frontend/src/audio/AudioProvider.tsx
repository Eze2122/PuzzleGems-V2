import { AudioPlayer, setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

import { AudioSettings, defaultAudioSettings, loadAudioSettings, saveAudioSettings } from "@/src/audio/settings";

// 5 light, loop-safe tracks (see scripts/make-music.py): A 1-20, B 21-40, C 41-60, D 61-80, E 81-100
const MUSIC_TRACKS = [
  require("../../assets/audio/music-a.mp3"),
  require("../../assets/audio/music-b.mp3"),
  require("../../assets/audio/music-c.mp3"),
  require("../../assets/audio/music-d.mp3"),
  require("../../assets/audio/music-e.mp3"),
];
const MOVE_SRC = require("../../assets/audio/move.wav");
const WIN_SRC = require("../../assets/audio/win.wav");

type AudioContextValue = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
  playMove: () => void;
  playWin: () => void;
  setTrack: (index: number) => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

// Player configuration lives outside the component so hook values are not mutated in render scope.
function configurePlayer(player: AudioPlayer, volume: number, loop = false) {
  player.loop = loop;
  player.volume = volume;
}

function replay(player: AudioPlayer) {
  try {
    void player.seekTo(0);
    player.play();
  } catch { /* ignore */ }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const music = useAudioPlayer(MUSIC_TRACKS[0]);
  const move = useAudioPlayer(MOVE_SRC);
  const win = useAudioPlayer(WIN_SRC);

  const [settings, setSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [loaded, setLoaded] = useState(false);
  const [track, setTrackState] = useState(0);
  const loadedTrack = useRef(0);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: "mixWithOthers", shouldPlayInBackground: false });
    configurePlayer(music, 0.3, true);
    configurePlayer(move, 0.8);
    configurePlayer(win, 0.9);
  }, [music, move, win]);

  useEffect(() => {
    let active = true;
    loadAudioSettings().then((s) => {
      if (!active) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  // Switch track (only when the level group changes) and apply the music toggle.
  useEffect(() => {
    if (!loaded) return;
    if (track !== loadedTrack.current) {
      try {
        music.replace(MUSIC_TRACKS[track]);
        configurePlayer(music, 0.3, true);
      } catch { /* ignore */ }
      loadedTrack.current = track;
    }
    if (settings.music) music.play();
    else music.pause();
  }, [loaded, music, settings.music, track]);

  const persist = useCallback((next: AudioSettings) => {
    setSettings(next);
    void saveAudioSettings(next);
  }, []);

  const toggleMusic = useCallback(() => persist({ ...settings, music: !settings.music }), [persist, settings]);
  const toggleSfx = useCallback(() => persist({ ...settings, sfx: !settings.sfx }), [persist, settings]);

  const playMove = useCallback(() => { if (settings.sfx) replay(move); }, [move, settings.sfx]);
  const playWin = useCallback(() => { if (settings.sfx) replay(win); }, [win, settings.sfx]);

  const setTrack = useCallback((index: number) => {
    setTrackState(Math.max(0, Math.min(MUSIC_TRACKS.length - 1, index)));
  }, []);

  return (
    <AudioContext.Provider
      value={{ musicEnabled: settings.music, sfxEnabled: settings.sfx, toggleMusic, toggleSfx, playMove, playWin, setTrack }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    return {
      musicEnabled: false, sfxEnabled: false,
      toggleMusic: () => {}, toggleSfx: () => {}, playMove: () => {}, playWin: () => {}, setTrack: () => {},
    };
  }
  return ctx;
}
