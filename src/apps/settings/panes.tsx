import type { ReactNode } from "react";
import { ACCENTS, type Appearance, type DockPosition, useIsDark, useSettings } from "../../os/settings";
import { WALLPAPERS } from "../../os/wallpapers";
import { Slider } from "../../ui/Slider";
import { Group, Row } from "./Group";

/** Miniature desktop used as the Light / Dark / Auto picker, like System Settings. */
const MODE_PREVIEW: Record<Appearance, string> = {
  light: "linear-gradient(135deg, #dbeafe, #93c5fd)",
  dark: "linear-gradient(135deg, #1e1b4b, #0f172a)",
  auto: "linear-gradient(135deg, #dbeafe 50%, #0f172a 50%)",
};

export function AppearancePane() {
  const appearance = useSettings((s) => s.appearance);
  const accent = useSettings((s) => s.accent);
  const set = useSettings((s) => s.set);
  return (
    <Group>
      <Row label="Appearance">
        {(Object.keys(MODE_PREVIEW) as Appearance[]).map((mode) => (
          <button
            key={mode}
            type="button"
            className="flex flex-col items-center gap-1 text-xs capitalize"
            onClick={() => set({ appearance: mode })}
          >
            <span
              className={`relative h-11 w-[68px] overflow-hidden rounded-md shadow-[0_0_0_0.5px_rgb(0_0_0/0.2)] ${appearance === mode ? "ring-[3px] ring-accent" : ""}`}
              style={{ background: MODE_PREVIEW[mode] }}
            >
              <span
                className={`absolute top-2 left-2 h-6 w-10 rounded-sm shadow ${mode === "dark" ? "bg-zinc-700" : "bg-white"}`}
              />
            </span>
            <span className={appearance === mode ? "font-semibold" : "text-muted"}>{mode}</span>
          </button>
        ))}
      </Row>
      <Row label="Accent color">
        {ACCENTS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Accent ${color}`}
            className="grid size-4 place-items-center rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.2)]"
            style={{ background: color }}
            onClick={() => set({ accent: color })}
          >
            {accent === color && <span className="size-1.5 rounded-full bg-white" />}
          </button>
        ))}
      </Row>
    </Group>
  );
}

export function WallpaperPane() {
  const wallpaper = useSettings((s) => s.wallpaper);
  const set = useSettings((s) => s.set);
  const dark = useIsDark();
  const current = WALLPAPERS[wallpaper] ?? WALLPAPERS[0];
  return (
    <div className="flex flex-col gap-5">
      <Group>
        <div className="flex items-center gap-4 p-3">
          <span
            className="aspect-video w-48 rounded-lg shadow-md"
            style={{ background: dark ? current?.dark : current?.light }}
          />
          <div>
            <p className="font-semibold">{current?.name}</p>
            <p className="text-muted text-xs">Changes with Light and Dark appearance</p>
          </div>
        </div>
      </Group>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
        {WALLPAPERS.map((w, i) => (
          <button
            key={w.name}
            type="button"
            className="flex flex-col gap-1.5 text-center text-xs"
            onClick={() => set({ wallpaper: i })}
          >
            <span
              className={`aspect-video rounded-lg shadow ${wallpaper === i ? "ring-[3px] ring-accent ring-offset-2 ring-offset-surface" : ""}`}
              style={{ background: dark ? w.dark : w.light }}
            />
            {w.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DockPane() {
  const dock = useSettings((s) => s.dock);
  const setDock = useSettings((s) => s.setDock);
  const scale = (left: string, right: string, control: ReactNode) => (
    <span className="flex items-center gap-2 text-[11px] text-muted">
      {left}
      {control}
      {right}
    </span>
  );
  return (
    <Group>
      <Row label="Size">
        {scale(
          "Small",
          "Large",
          <Slider
            label="Dock size"
            className="w-44"
            min={32}
            max={80}
            step={1}
            value={dock.size}
            onChange={(size) => setDock({ size })}
          />,
        )}
      </Row>
      <Row label="Magnification">
        {scale(
          "Off",
          "Max",
          <Slider
            label="Magnification"
            className="w-44"
            min={1}
            max={2.2}
            step={0.1}
            value={dock.magnify}
            onChange={(magnify) => setDock({ magnify })}
          />,
        )}
      </Row>
      <Row label="Position on screen">
        <select
          aria-label="Position on screen"
          className="popup capitalize"
          value={dock.position}
          onChange={(e) => setDock({ position: e.target.value as DockPosition })}
        >
          {["left", "bottom", "right"].map((position) => (
            <option key={position} value={position}>
              {position[0]?.toUpperCase() + position.slice(1)}
            </option>
          ))}
        </select>
      </Row>
      <Row label="Automatically hide and show the Dock">
        <input
          type="checkbox"
          aria-label="Automatically hide the Dock"
          className="switch"
          checked={dock.autohide}
          onChange={(e) => setDock({ autohide: e.target.checked })}
        />
      </Row>
    </Group>
  );
}
