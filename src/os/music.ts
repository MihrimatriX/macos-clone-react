import { create } from "zustand";
import { fileUrl, TRASH, useFs } from "./fs";

/** Every audio file in the VFS, in name order; Music's library and Control Center's fallback queue. */
export const libraryIds = () =>
  Object.values(useFs.getState().nodes)
    .filter((n) => n.mime.startsWith("audio/") && n.parentId !== TRASH)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => n.id);

/** One audio element for the whole OS, so playback survives closing the Music window. */
const audio = typeof Audio === "undefined" ? null : new Audio();

interface MusicState {
  queue: string[];
  index: number;
  playing: boolean;
  time: number;
  duration: number;
  volume: number;
  play: (queue: string[], index: number) => void;
  toggle: () => void;
  skip: (delta: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
}

export const useMusic = create<MusicState>()((set, get) => {
  const load = (index: number) => {
    const id = get().queue[index];
    const node = id ? useFs.getState().nodes[id] : undefined;
    if (!audio || !node) return;
    set({ index, time: 0 });
    audio.src = fileUrl(node);
    audio.play().catch(() => set({ playing: false }));
  };

  if (audio) {
    audio.addEventListener("timeupdate", () => set({ time: audio.currentTime }));
    audio.addEventListener("loadedmetadata", () => set({ duration: audio.duration }));
    audio.addEventListener("play", () => set({ playing: true }));
    audio.addEventListener("pause", () => set({ playing: false }));
    audio.addEventListener("ended", () => get().skip(1));
  }

  return {
    queue: [],
    index: 0,
    playing: false,
    time: 0,
    duration: 0,
    volume: 0.7,
    play: (queue, index) => {
      set({ queue });
      load(index);
    },
    toggle: () => {
      if (!audio) return;
      if (!audio.src) get().play(get().queue.length ? get().queue : libraryIds(), get().index);
      else if (audio.paused) audio.play().catch(() => set({ playing: false }));
      else audio.pause();
    },
    skip: (delta) => {
      const { queue, index } = get();
      if (queue.length) load((index + delta + queue.length) % queue.length);
    },
    seek: (time) => {
      if (audio) audio.currentTime = time;
    },
    setVolume: (volume) => {
      if (audio) audio.volume = volume;
      set({ volume });
    },
  };
});

if (audio) audio.volume = useMusic.getState().volume;
