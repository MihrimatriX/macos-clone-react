import { Image, type LucideIcon, Palette, PanelBottom, RotateCcw, Search, UserRound } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useSettings } from "../../os/settings";
import { useWindows } from "../../os/windows";
import { Avatar } from "../../ui/Avatar";
import { Sidebar } from "../../ui/Sidebar";
import { ResetPane, UsersPane } from "./account";
import { AppearancePane, DockPane, WallpaperPane } from "./panes";

const DEFAULT_PANE = "Appearance";

const PANES: Record<string, { icon: LucideIcon; color: string; Content: () => ReactNode }> = {
  Appearance: { icon: Palette, color: "#1c1c1e", Content: AppearancePane },
  Wallpaper: { icon: Image, color: "#30b0c7", Content: WallpaperPane },
  "Desktop & Dock": { icon: PanelBottom, color: "#1c1c1e", Content: DockPane },
  "Users & Groups": { icon: UserRound, color: "#007aff", Content: UsersPane },
  "Transfer or Reset": { icon: RotateCcw, color: "#8e8e93", Content: ResetPane },
};

export default function Settings({ win }: AppProps) {
  const userName = useSettings((s) => s.userName);
  const [query, setQuery] = useState("");
  const pane = win.props.pane && PANES[win.props.pane] ? win.props.pane : DEFAULT_PANE;
  const Content = PANES[pane]?.Content ?? (() => null);
  const show = (id: string) => useWindows.getState().update(win.id, { props: { ...win.props, pane: id } });

  const items = Object.entries(PANES)
    .filter(([id]) => id.toLowerCase().includes(query.toLowerCase()))
    .map(([id, { icon: Icon, color }]) => ({
      id,
      label: id,
      icon: (
        <span className="grid size-5 shrink-0 place-items-center rounded-[5px] shadow-sm" style={{ background: color }}>
          <Icon className="size-3 text-white" strokeWidth={2.25} />
        </span>
      ),
    }));

  const header = (
    <>
      <label className="search-field">
        <Search size={14} className="shrink-0" />
        <input
          aria-label="Search settings"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && items[0] && show(items[0].id)}
        />
      </label>
      <button
        type="button"
        className={`flex items-center gap-2.5 rounded-[7px] p-1.5 text-left ${pane === "Users & Groups" ? "bg-selected" : ""}`}
        onClick={() => show("Users & Groups")}
      >
        <Avatar size={34} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{userName}</span>
          <span className="block text-muted text-xs">Guest Account</span>
        </span>
      </button>
    </>
  );

  return (
    <div className="flex h-full">
      <Sidebar sections={[{ items }]} active={pane} onSelect={show} header={header} />
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="titlebar toolbar">
          <h1 className="font-bold text-[15px]">{pane}</h1>
        </div>
        <section className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <Content />
        </section>
      </div>
    </div>
  );
}
