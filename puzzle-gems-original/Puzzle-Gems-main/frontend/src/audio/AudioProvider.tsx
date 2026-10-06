import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

import { AudioSettings, defaultAudioSettings, loadAudioSettings, saveAudioSettings } from "@/src/audio/settings";

const MUSIC_SRC = require("../../assets/audio/music.wav");
const MOVE_SRC = require("../../assets/audio/move.wav");
const WIN_SRC = require("../../assets/audio/win.wav");

type AudioContextValue = {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
  playMove: () => void;
  playWin: () => void;
};

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const music = useAudioPlayer(MUSIC_SRC);
  const move = useAudioPlayer(MOVE_SRC);
  const win = useAudioPlayer(WIN_SRC);

  const [settings, setSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [loaded, setLoaded] = useState(false);
  const musicRef = useRef(music);
  musicRef.current = music;

  // One-time audio mode + volume setup
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    });
    music.loop = true;
    music.volume = 0.32;
    move.volume = 0.8;
    win.volume = 0.9;
  }, [music, move, win]);

  // Load persisted settings
  useEffect(() => {
    let active = true;
    loadAudioSettings().then((s) => {
      if (!active) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  // Apply music enabled state
  useEffect(() => {
    if (!loaded) return;
    if (settings.music) {
      music.play();
    } else {
      music.pause();
    }
  }, [loaded, music, settings.music]);

  const persist = useCallback((next: AudioSettings) => {
    setSettings(next);
    void saveAudioSettings(next);
  }, []);

  const toggleMusic = useCallback(() => {
    persist({ ...settings, music: !settings.music });
  }, [persist, settings]);

  const toggleSfx = useCallback(() => {
    persist({ ...settings, sfx: !settings.sfx });
  }, [persist, settings]);

  const playMove = useCallback(() => {
    if (!settings.sfx) return;
    try {
      move.seekTo(0);
      move.play();
    } catch { /* ignore */ }
  }, [move, settings.sfx]);

  const playWin = useCallback(() => {
    if (!settings.sfx) return;
    try {
      win.seekTo(0);
      win.play();
    } catch { /* ignore */ }
  }, [win, settings.sfx]);

  return (
    <AudioContext.Provider
      value={{
        musicEnabled: settings.music,
        sfxEnabled: settings.sfx,
        toggleMusic,
        toggleSfx,
        playMove,
        playWin,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    // Safe fallback for environments where provider is not mounted
    return {
      musicEnabled: false,
      sfxEnabled: false,
      toggleMusic: () => {},
      toggleSfx: () => {},
      playMove: () => {},
      playWin: () => {},
    };
  }
  return ctx;
}
