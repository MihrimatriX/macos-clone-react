import { Bluetooth, type LucideIcon, Moon, Music, Pause, Play, SkipForward, Sun, Volume2, Wifi } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useFs } from "../os/fs";
import { useMusic } from "../os/music";
import { useIsDark, useSettings } from "../os/settings";
import { useSystem } from "../os/system";
import { Slider } from "../ui/Slider";

function Tile({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-flat rounded-[22px] p-3 ${className}`}>{children}</div>;
}

function Toggle({
  label,
  icon: Icon,
  on,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={on} className="flex items-center gap-2.5 text-left" onClick={onClick}>
      <span
        className={`grid size-[34px] shrink-0 place-items-center rounded-full transition-colors ${on ? "bg-accent text-white shadow-[inset_0_1px_1px_rgb(255_255_255/0.35)]" : "glass-flat"}`}
      >
        <Icon size={15} strokeWidth={2.25} />
      </span>
      <span>
        <span className="block font-semibold text-xs leading-tight">{label}</span>
        <span className="block text-[11px] text-muted leading-tight">{on ? "On" : "Off"}</span>
      </span>
    </button>
  );
}

/** Thick slider with the glyph drawn over the white fill, as in Control Center. */
function SliderTile({
  label,
  icon: Icon,
  value,
  min,
  onChange,
}: {
  label: string;
  icon: LucideIcon;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <Tile>
      <p className="mb-2 font-semibold text-xs">{label}</p>
      <div className="relative flex items-center">
        <Slider label={label} large min={min} value={value} onChange={onChange} />
        <Icon size={13} strokeWidth={2.5} className="pointer-events-none absolute left-1.5 text-zinc-500" />
      </div>
    </Tile>
  );
}

function Panel() {
  const wifi = useSettings((s) => s.wifi);
  const bluetooth = useSettings((s) => s.bluetooth);
  const brightness = useSettings((s) => s.brightness);
  const set = useSettings((s) => s.set);
  const dark = useIsDark();
  const volume = useMusic((s) => s.volume);
  const playing = useMusic((s) => s.playing);
  const trackId = useMusic((s) => s.queue[s.index]);
  const track = useFs((s) => (trackId ? s.nodes[trackId]?.name : undefined));
  const { toggle, skip, setVolume } = useMusic.getState();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="glass fixed top-10 right-2 z-[2001] grid w-[320px] gap-2.5 rounded-[30px] p-3 [--blur:30px]"
    >
      <div className="grid grid-cols-2 gap-2">
        <Tile className="flex flex-col gap-3">
          <Toggle label="Wi-Fi" icon={Wifi} on={wifi} onClick={() => set({ wifi: !wifi })} />
          <Toggle label="Bluetooth" icon={Bluetooth} on={bluetooth} onClick={() => set({ bluetooth: !bluetooth })} />
        </Tile>
        <Tile className="flex items-center">
          <Toggle
            label="Dark Mode"
            icon={Moon}
            on={dark}
            onClick={() => set({ appearance: dark ? "light" : "dark" })}
          />
        </Tile>
      </div>
      <SliderTile label="Display" icon={Sun} value={brightness} min={0.3} onChange={(v) => set({ brightness: v })} />
      <SliderTile label="Sound" icon={Volume2} value={volume} min={0} onChange={setVolume} />
      <Tile className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-rose-400 to-fuchsia-600 text-white shadow">
          <Music size={18} />
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-xs">
          {track?.replace(/\.[^.]+$/, "") ?? "Not Playing"}
        </span>
        <button type="button" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button type="button" aria-label="Next track" onClick={() => skip(1)}>
          <SkipForward size={18} fill="currentColor" />
        </button>
      </Tile>
    </motion.div>
  );
}

export function ControlCenter() {
  const open = useSystem((s) => s.overlay === "control");
  const close = useSystem((s) => s.closeOverlay);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[2000]" onMouseDown={close} />
      <Panel />
    </>
  );
}
