import {
  Bluetooth,
  FolderPlus,
  Images,
  Lock,
  type LucideIcon,
  Moon,
  PanelBottomClose,
  Search,
  SquarePen,
  SunDim,
  VolumeX,
  Wifi,
  ZoomIn,
} from "lucide-react";
import { useNotes } from "../../apps/notes/store";
import { DESKTOP, uniqueName, useFs } from "../../os/fs";
import { useMusic } from "../../os/music";
import { useIsDark, useSettings } from "../../os/settings";
import { useSystem } from "../../os/system";
import { WALLPAPERS } from "../../os/wallpapers";
import { useWindows } from "../../os/windows";
import { ClockWidget, UpNextWidget } from "./Time";
import { WeatherWidget } from "./Weather";
import { Widget } from "./Widget";

function Tile({
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
    <button
      type="button"
      aria-pressed={on}
      className={`flex flex-col justify-between rounded-[14px] p-1.5 text-left text-[10px] leading-tight transition-colors ${
        on ? "bg-white/90 text-black/80" : "bg-black/[0.08] text-fg/70 dark:bg-white/[0.08]"
      }`}
      onClick={onClick}
    >
      <Icon size={14} strokeWidth={2.25} className={on ? "text-amber-500" : ""} />
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function ControlsWidget() {
  const s = useSettings();
  const dark = useIsDark();
  const volume = useMusic((m) => m.volume);
  const tiles: [string, LucideIcon, boolean, () => void][] = [
    ["Wi-Fi", Wifi, s.wifi, () => s.set({ wifi: !s.wifi })],
    ["Bluetooth", Bluetooth, s.bluetooth, () => s.set({ bluetooth: !s.bluetooth })],
    ["Dark Mode", Moon, dark, () => s.set({ appearance: dark ? "light" : "dark" })],
    ["Mute", VolumeX, volume === 0, () => useMusic.getState().setVolume(volume === 0 ? 0.7 : 0)],
    ["Dim Display", SunDim, s.brightness < 1, () => s.set({ brightness: s.brightness < 1 ? 1 : 0.65 })],
    ["Hide Dock", PanelBottomClose, s.dock.autohide, () => s.setDock({ autohide: !s.dock.autohide })],
    ["Magnify", ZoomIn, s.dock.magnify > 1, () => s.setDock({ magnify: s.dock.magnify > 1 ? 1 : 1.6 })],
    ["Wallpaper", Images, false, () => s.set({ wallpaper: (s.wallpaper + 1) % WALLPAPERS.length })],
  ];
  return (
    <Widget wide className="grid grid-cols-4 gap-1.5 p-2">
      {tiles.map(([label, icon, on, onClick]) => (
        <Tile key={label} label={label} icon={icon} on={on} onClick={onClick} />
      ))}
    </Widget>
  );
}

function ShortcutsWidget() {
  const { open } = useWindows.getState();
  const shortcuts: [string, LucideIcon, string, () => void][] = [
    [
      "New Note",
      SquarePen,
      "from-[#5aa2ff] to-[#2f6fe4]",
      () => {
        useNotes.getState().add("Notes");
        open("notes");
      },
    ],
    [
      "New Folder",
      FolderPlus,
      "from-[#ff7a7a] to-[#ee4d5c]",
      () => {
        const fs = useFs.getState();
        fs.create(DESKTOP, uniqueName(fs.nodes, DESKTOP, "untitled folder"), "dir");
      },
    ],
    ["Lock Screen", Lock, "from-[#ff8a65] to-[#f4511e]", () => useSystem.getState().setPhase("login")],
    ["Spotlight", Search, "from-[#b07cff] to-[#7d4ce6]", () => useSystem.getState().toggle("spotlight")],
  ];
  return (
    <Widget wide className="grid grid-cols-2 gap-1.5 p-2">
      {shortcuts.map(([label, Icon, color, run]) => (
        <button
          key={label}
          type="button"
          className={`flex flex-col justify-between rounded-[16px] bg-gradient-to-br p-2.5 text-left font-semibold text-[12px] text-white ${color}`}
          onClick={run}
        >
          <Icon size={15} strokeWidth={2.25} />
          {label}
        </button>
      ))}
    </Widget>
  );
}
/** The widget column at the bottom of Notification Center. */
export function Widgets() {
  return (
    <div className="flex flex-col items-center gap-3.5 pb-2">
      <WeatherWidget />
      <div className="flex gap-3.5">
        <ClockWidget />
        <UpNextWidget />
      </div>
      <ControlsWidget />
      <ShortcutsWidget />
    </div>
  );
}
