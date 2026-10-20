import {
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Search,
  SlidersHorizontal,
  Wifi,
  WifiOff,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { getApp, type MenuEntry, menusFor } from "../os/apps";
import { runCommand } from "../os/hotkeys";
import { useSettings } from "../os/settings";
import { type Phase, useSystem } from "../os/system";
import { activeAppId, useWindows } from "../os/windows";
import { Logo } from "../ui/AppIcons";
import { type MenuItem, MenuList } from "../ui/Menu";

/** Ends the session: windows close without prompting, then the machine moves to the given phase. */
function powerOff(phase: Phase) {
  useWindows.setState({ wins: [], focusedId: null });
  useSystem.getState().setPhase(phase);
}

const systemMenu: MenuItem[] = [
  { label: "About This Mac", onSelect: () => runCommand("about") },
  "sep",
  { label: "System Settings…", onSelect: () => runCommand("settings") },
  "sep",
  { label: "Sleep", onSelect: () => useSystem.getState().setPhase("sleep") },
  { label: "Restart…", onSelect: () => powerOff("boot") },
  { label: "Shut Down…", onSelect: () => powerOff("off") },
  "sep",
  { label: "Lock Screen", shortcut: "⌃⌘Q", onSelect: () => useSystem.getState().setPhase("login") },
  { label: "Log Out…", onSelect: () => powerOff("login") },
];

const toItem = (entry: MenuEntry): MenuItem =>
  entry === "sep" ? entry : { label: entry.label, shortcut: entry.shortcut, onSelect: () => runCommand(entry.command) };

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

function useBattery() {
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    let manager: BatteryManager | undefined;
    const update = () => manager && setBattery({ level: manager.level, charging: manager.charging });
    nav.getBattery?.().then((m) => {
      manager = m;
      update();
      m.addEventListener("levelchange", update);
      m.addEventListener("chargingchange", update);
    });
    return () => {
      manager?.removeEventListener("levelchange", update);
      manager?.removeEventListener("chargingchange", update);
    };
  }, []);
  return battery;
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  if (charging) return <BatteryCharging size={18} />;
  if (level > 0.7) return <BatteryFull size={18} />;
  if (level > 0.3) return <BatteryMedium size={18} />;
  return <BatteryLow size={18} />;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // Two separate formats give macOS's "Sun 4 Oct  03:17" without the locale's comma.
  return [
    now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
    now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  ];
}

function BarButton({
  label,
  onClick,
  children,
  open = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-6 items-center rounded-full border border-transparent px-2.5 ${open ? "glass-thick" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function MenuBar() {
  const app = getApp(useWindows(activeAppId));
  const wifi = useSettings((s) => s.wifi);
  const toggle = useSystem((s) => s.toggle);
  const overlay = useSystem((s) => s.overlay);
  const battery = useBattery();
  const clock = useClock();
  const [open, setOpen] = useState<number | null>(null);

  const menus = [
    { name: "System menu", title: <Logo size={16} />, items: systemMenu },
    ...menusFor(app).map((m, i) => ({
      name: m.title,
      title: i === 0 ? <b>{m.title}</b> : m.title,
      items: m.items.map(toItem),
    })),
  ];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (open === null || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    setOpen((open + (e.key === "ArrowRight" ? 1 : menus.length - 1)) % menus.length);
  };

  return (
    <>
      {open !== null && <div className="fixed inset-0 z-[1000]" onMouseDown={() => setOpen(null)} />}
      <header
        // Tahoe draws the menu bar with no backing at all; a faint halo keeps text legible on busy wallpapers.
        className="fixed inset-x-0 top-0 z-[1001] flex h-8 items-center px-2.5 font-medium text-[13px] text-black/85 [text-shadow:0_0_6px_rgb(255_255_255/0.45)] dark:text-white dark:[text-shadow:0_1px_3px_rgb(0_0_0/0.4)] [&_svg]:shrink-0"
        onKeyDown={onKeyDown}
      >
        {menus.map((menu, i) => (
          <div key={menu.name} className="relative" onMouseEnter={() => open !== null && setOpen(i)}>
            <BarButton label={menu.name} open={open === i} onClick={() => setOpen(open === i ? null : i)}>
              {menu.title}
            </BarButton>
            {open === i && (
              <MenuList items={menu.items} onClose={() => setOpen(null)} className="absolute top-7 left-0" />
            )}
          </div>
        ))}
        <div className="ml-auto flex items-center">
          {battery && (
            <span className="flex items-center gap-1.5 px-2.5 text-xs" title={`${Math.round(battery.level * 100)}%`}>
              {Math.round(battery.level * 100)}%
              <BatteryIcon {...battery} />
            </span>
          )}
          <BarButton label="Wi-Fi" onClick={() => toggle("control")}>
            {wifi ? <Wifi size={15} strokeWidth={2.25} /> : <WifiOff size={15} strokeWidth={2.25} />}
          </BarButton>
          <BarButton label="Spotlight" open={overlay === "spotlight"} onClick={() => toggle("spotlight")}>
            <Search size={14} strokeWidth={2.5} />
          </BarButton>
          <BarButton label="Control Center" open={overlay === "control"} onClick={() => toggle("control")}>
            <SlidersHorizontal size={14} strokeWidth={2.25} />
          </BarButton>
          <BarButton
            label="Notification Center"
            open={overlay === "notifications"}
            onClick={() => toggle("notifications")}
          >
            <span className="flex gap-2 tabular-nums">
              <span>{clock[0]}</span>
              <span>{clock[1]}</span>
            </span>
          </BarButton>
        </div>
      </header>
    </>
  );
}
