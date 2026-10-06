"""Generates 5 calm, positive, instrumental loop tracks for Puzzle Gems.

Original synthesized audio (no third-party rights). Output: assets/audio/music-a..e.mp3
Run: python3 scripts/make-music.py  (needs numpy + imageio-ffmpeg)
"""
import os
import subprocess
import wave

import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")

NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def freq(name: str) -> float:
    n, octave = name[:-1], int(name[-1])
    semis = NOTE[n[0]] + (1 if "#" in n else 0) - (1 if n.endswith("b") else 0)
    midi = 12 * (octave + 1) + semis
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, a, r):
    e = np.ones(n)
    a, r = min(a, n // 2), min(r, n // 2)
    e[:a] = np.linspace(0, 1, a)
    e[-r:] = np.linspace(1, 0, r) ** 2
    return e


def pad(f, dur, vol):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * m * t + d) / (m * m) for m, d in ((1, 0), (2, 0.3), (3, 0.7)))
    s += 0.5 * np.sin(2 * np.pi * f * 1.004 * t)  # gentle chorus
    return vol * s * env(n, int(SR * 0.8), int(SR * 0.9))


def bell(f, dur, vol):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) + 0.12 * np.sin(2 * np.pi * f * 3.01 * t)
    return vol * s * np.exp(-t * 3.2) * env(n, 80, int(SR * 0.05))


def track(chords, melody, bpm, bars_per_chord=1):
    beat = 60 / bpm
    bar = beat * 4
    total = bar * bars_per_chord * len(chords)
    out = np.zeros(int(SR * (total + 2)))
    # pads
    for i, ch in enumerate(chords):
        start = int(SR * i * bar * bars_per_chord)
        for note in ch:
            p = pad(freq(note), bar * bars_per_chord + 0.9, 0.06)
            out[start:start + len(p)] += p
    # melody: list of (beat_index, note, beats)
    for b, note, length in melody:
        if note is None:
            continue
        s = bell(freq(note), max(0.6, beat * length + 0.5), 0.12)
        start = int(SR * b * beat)
        out[start:start + len(s)] += s
    # loop-safe: fold tail into head
    n = int(SR * total)
    tail = out[n:]
    out = out[:n]
    out[: len(tail)] += tail
    # soft echo
    d = int(SR * beat * 0.75)
    echo = np.zeros_like(out)
    echo[d:] = out[:-d] * 0.22
    out = out + echo
    out /= np.max(np.abs(out)) + 1e-9
    return (out * 0.7 * 32767).astype(np.int16)


def arp(chords, pattern, bars_per_chord=1, octave_shift=None):
    """Create a gentle melody by walking chord tones."""
    mel = []
    beat = 0
    for ch in chords:
        tones = [n[:-1] + str(int(n[-1]) + 1) for n in ch]
        for _ in range(bars_per_chord):
            for step, length in pattern:
                mel.append((beat, tones[step % len(tones)] if step >= 0 else None, length))
                beat += length
    return mel


TRACKS = {
    # A: C major, bright & welcoming
    "a": (["C3", "E3", "G3"], ["A2", "C3", "E3"], ["F2", "A2", "C3"], ["G2", "B2", "D3"]),
    # B: F major, warm
    "b": (["F2", "A2", "C3"], ["D3", "F3", "A3"], ["Bb2", "D3", "F3"], ["C3", "E3", "G3"]),
    # C: G major, playful
    "c": (["G2", "B2", "D3"], ["E3", "G3", "B3"], ["C3", "E3", "G3"], ["D3", "F#3", "A3"]),
    # D: D major, dreamy
    "d": (["D3", "F#3", "A3"], ["B2", "D3", "F#3"], ["G2", "B2", "D3"], ["A2", "C#3", "E3"]),
    # E: Eb major, gentle focus
    "e": (["Eb3", "G3", "Bb3"], ["C3", "Eb3", "G3"], ["Ab2", "C3", "Eb3"], ["Bb2", "D3", "F3"]),
}
PATTERNS = {
    "a": [(0, 1), (1, 1), (2, 1), (1, 1)],
    "b": [(2, 1.5), (1, 0.5), (0, 2)],
    "c": [(0, 0.5), (1, 0.5), (2, 1), (-1, 1), (1, 1)],
    "d": [(0, 2), (2, 1), (1, 1)],
    "e": [(1, 1), (2, 1), (0, 1), (-1, 1)],
}
BPM = {"a": 84, "b": 78, "c": 90, "d": 72, "e": 76}

if __name__ == "__main__":
    import imageio_ffmpeg

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    for key, chords in TRACKS.items():
        chords = list(chords) * 2
        data = track(chords, arp(chords, PATTERNS[key]), BPM[key], 1)
        wav_path = f"/tmp/music-{key}.wav"
        with wave.open(wav_path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(data.tobytes())
        mp3 = os.path.join(OUT, f"music-{key}.mp3")
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", wav_path, "-ac", "1", "-b:a", "48k", mp3], check=True)
        print(mp3, os.path.getsize(mp3))
