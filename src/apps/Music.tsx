import { Music as MusicIcon, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import type { AppProps } from "../os/apps";
import { findChild, formatSize, HOME, kindLabel, sizeOf, TRASH, useFs } from "../os/fs";
import { libraryIds, useMusic } from "../os/music";
import { useCommand } from "../os/windows";
import { Slider } from "../ui/Slider";

const clock = (seconds: number) =>
  Number.isFinite(seconds)
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
    : "0:00";

function playTrack(id: string) {
  const ids = libraryIds();
  useMusic.getState().play(ids, Math.max(0, ids.indexOf(id)));
}

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "");

export default function Music({ win }: AppProps) {
  const nodes = useFs((s) => s.nodes);
  const tracks = Object.values(nodes)
    .filter((n) => n.mime.startsWith("audio/") && n.parentId !== TRASH)
    .sort((a, b) => a.name.localeCompare(b.name));
  const { queue, index, playing, time, duration, volume } = useMusic(
    useShallow((s) => ({
      queue: s.queue,
      index: s.index,
      playing: s.playing,
      time: s.time,
      duration: s.duration,
      volume: s.volume,
    })),
  );
  const { toggle, skip, seek, setVolume } = useMusic.getState();
  const fileInput = useRef<HTMLInputElement>(null);
  const currentId = queue[index];
  const current = tracks.find((t) => t.id === currentId);

  // Opening an audio file from Finder plays it.
  useEffect(() => {
    if (win.props.fileId) playTrack(win.props.fileId);
  }, [win.props.fileId]);

  const importFiles = async (files: FileList | null) => {
    const fs = useFs.getState();
    const musicDir = findChild(fs.nodes, HOME, "Music")?.id ?? HOME;
    for (const file of files ?? []) if (file.type.startsWith("audio/")) await fs.importFile(musicDir, file);
  };

  useCommand(win.id, (command) => {
    if (command === "toggle") toggle();
    if (command === "next") skip(1);
    if (command === "previous") skip(-1);
    if (command === "louder") setVolume(Math.min(1, volume + 0.1));
    if (command === "quieter") setVolume(Math.max(0, volume - 0.1));
    if (command === "import") fileInput.current?.click();
  });

  return (
    <div
      className="flex h-full flex-col bg-surface"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        importFiles(e.dataTransfer.files);
      }}
    >
      <header className="titlebar toolbar gap-3 pl-[84px]">
        <div className="flex">
          <button type="button" aria-label="Previous" className="tool" onClick={() => skip(-1)}>
            <SkipBack className="fill-current" />
          </button>
          <button type="button" aria-label={playing ? "Pause" : "Play"} className="tool" onClick={toggle}>
            {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </button>
          <button type="button" aria-label="Next" className="tool" onClick={() => skip(1)}>
            <SkipForward className="fill-current" />
          </button>
        </div>
        <div className="mx-auto flex h-10 w-full max-w-md min-w-0 items-center gap-2.5 overflow-hidden rounded-[7px] bg-hover pr-3 shadow-[inset_0_0_0_0.5px_var(--line)]">
          <span className="grid h-full aspect-square place-items-center bg-gradient-to-br from-rose-400 to-fuchsia-600 text-white">
            <MusicIcon size={16} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-center">
            <p className="w-full truncate text-center font-medium text-xs">
              {current ? stripExtension(current.name) : "Not Playing"}
            </p>
            <div className="flex w-full items-center gap-2 text-[10px] text-muted tabular-nums">
              {clock(time)}
              <Slider
                label="Seek"
                className="flex-1"
                min={0}
                max={duration || 1}
                step={0.1}
                value={time}
                onChange={seek}
              />
              {clock(duration)}
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-muted">
          <Volume2 size={15} />
          <Slider label="Volume" className="w-24" value={volume} onChange={setVolume} />
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5 pb-3">
        <h1 className="font-bold text-[26px]">Songs</h1>
        <p className="mb-3 text-muted text-xs">
          {tracks.length} songs · Double-click to play · Drop audio files to import
        </p>
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_8rem_5rem] gap-3 border-line border-b px-2 pb-1 text-[11px] text-muted">
          <span className="text-right">#</span>
          <span>Title</span>
          <span>Kind</span>
          <span className="text-right">Size</span>
        </div>
        {tracks.map((track, i) => {
          const isCurrent = track.id === currentId;
          return (
            <button
              key={track.id}
              type="button"
              className={`grid h-8 w-full grid-cols-[2rem_minmax(0,1fr)_8rem_5rem] items-center gap-3 rounded-[6px] px-2 text-left even:bg-black/[0.03] dark:even:bg-white/[0.04] ${
                isCurrent ? "text-accent" : ""
              }`}
              onDoubleClick={() => playTrack(track.id)}
            >
              <span className="flex justify-end text-muted tabular-nums">
                {isCurrent && playing ? <Volume2 size={13} className="text-accent" /> : i + 1}
              </span>
              <span className="truncate font-medium">{stripExtension(track.name)}</span>
              <span className="truncate text-muted">{kindLabel(track)}</span>
              <span className="text-right text-muted tabular-nums">{formatSize(sizeOf(nodes, track.id))}</span>
            </button>
          );
        })}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(e) => importFiles(e.target.files)}
      />
    </div>
  );
}
