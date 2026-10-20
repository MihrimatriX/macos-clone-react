import { type MotionValue, motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getApp, visibleApps } from "../os/apps";
import { APPLICATIONS, TRASH, useFs } from "../os/fs";
import { activateApp } from "../os/hotkeys";
import { useSettings } from "../os/settings";
import { useSystem } from "../os/system";
import { useWindows } from "../os/windows";
import { AppIcon } from "../ui/AppIcon";
import { LaunchpadIcon, TrashIcon } from "../ui/AppIcons";
import { allowDrop, dropInto } from "../ui/dnd";
import type { MenuItem } from "../ui/Menu";

interface ItemProps {
  label: string;
  pointer: MotionValue<number>;
  running?: boolean;
  onClick: () => void;
  menu?: () => MenuItem[];
  onDrop?: (e: React.DragEvent) => void;
  children: ReactNode;
}

/** Opens a Dock menu just past the Dock edge, centred on the icon, as macOS does. */
function openDockMenu(e: MouseEvent<HTMLElement>, items: MenuItem[]) {
  const position = useSettings.getState().dock.position;
  const icon = e.currentTarget.getBoundingClientRect();
  const bar = e.currentTarget.closest("nav")?.getBoundingClientRect() ?? icon;
  const at = {
    bottom: { clientX: icon.left + icon.width / 2, clientY: bar.top },
    left: { clientX: bar.right, clientY: icon.top + icon.height / 2 },
    right: { clientX: bar.left, clientY: icon.top + icon.height / 2 },
  }[position];
  useSystem.getState().openContextMenu({ ...at, preventDefault: () => e.preventDefault() }, items, position);
}

function DockItem({ label, pointer, running = false, onClick, menu, onDrop, children }: ItemProps) {
  const { size, magnify, position } = useSettings((s) => s.dock);
  const menuOpen = useSystem((s) => s.contextMenu !== null);
  const vertical = position !== "bottom";
  const ref = useRef<HTMLButtonElement>(null);
  const distance = useTransform(pointer, (p) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return Number.POSITIVE_INFINITY;
    return p - (vertical ? r.top + r.height / 2 : r.left + r.width / 2);
  });
  const target = useTransform(distance, [-size * 2.5, 0, size * 2.5], [size, size * magnify, size], { clamp: true });
  const scaled = useSpring(target, { mass: 0.1, stiffness: 180, damping: 14 });

  // Bounce once when the app goes from not running to running.
  const [bounce, setBounce] = useState(false);
  const wasRunning = useRef(running);
  useEffect(() => {
    if (running && !wasRunning.current) setBounce(true);
    wasRunning.current = running;
  }, [running]);
  const hop = { bottom: { y: [0, -22, 0, -10, 0] }, left: { x: [0, 22, 0, 10, 0] }, right: { x: [0, -22, 0, -10, 0] } };

  // The slot only grows along the Dock, so neighbours make room while the bar keeps its thickness;
  // the magnified icon is anchored to the screen edge and rises out of the bar.
  const slot = vertical ? { width: size, height: scaled } : { width: scaled, height: size };
  const anchor = {
    bottom: "items-end justify-center",
    left: "items-center justify-start",
    right: "items-center justify-end",
  }[position];
  const tooltip = { bottom: "bottom-full mb-3", left: "left-full ml-3", right: "right-full mr-3" }[position];
  const dot = { bottom: "-bottom-[6px]", left: "-left-[6px]", right: "-right-[6px]" }[position];

  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      className={`group relative flex ${anchor}`}
      style={slot}
      animate={bounce ? hop[position] : {}}
      transition={{ duration: 0.9 }}
      onAnimationComplete={() => setBounce(false)}
      onClick={onClick}
      onContextMenu={menu && ((e) => openDockMenu(e, menu()))}
      onDragOver={onDrop && allowDrop}
      onDrop={onDrop}
    >
      <motion.span className="relative block shrink-0" style={{ width: scaled, height: scaled }}>
        {children}
        {!menuOpen && (
          <span
            className={`glass-thick pointer-events-none absolute hidden whitespace-nowrap rounded-full px-3 py-1 text-[13px] text-fg group-hover:block ${tooltip}`}
          >
            {label}
          </span>
        )}
      </motion.span>
      {running && (
        <span
          aria-hidden="true"
          className={`absolute size-[5px] rounded-full bg-black/80 shadow-[0_0_0_0.5px_rgb(255_255_255/0.5)] dark:bg-white/90 dark:shadow-none ${dot}`}
        />
      )}
    </motion.button>
  );
}

/** The macOS Dock menu: the app's windows, an Options submenu, then window and app actions. */
function appMenu(appId: string): MenuItem[] {
  const { wins, focusedId, focus, open, hide, quit } = useWindows.getState();
  const { unpinned, loginItems, set } = useSettings.getState();
  const kept = !unpinned.includes(appId);
  const atLogin = loginItems.includes(appId);
  const toggle = (list: string[], inList: boolean) => (inList ? list.filter((id) => id !== appId) : [...list, appId]);
  const options: MenuItem = {
    label: "Options",
    items: [
      { label: "Keep in Dock", checked: kept, onSelect: () => set({ unpinned: toggle(unpinned, !kept) }) },
      { label: "Open at Login", checked: atLogin, onSelect: () => set({ loginItems: toggle(loginItems, atLogin) }) },
      "sep",
      { label: "Show in Finder", onSelect: () => open("finder", { dirId: APPLICATIONS }) },
    ],
  };
  const own = wins.filter((w) => w.appId === appId);
  if (own.length === 0) return [options, "sep", { label: "Open", onSelect: () => activateApp(appId) }];
  return [
    ...own.map((w) => ({ label: w.title, checked: w.id === focusedId, onSelect: () => focus(w.id) })),
    "sep",
    options,
    "sep",
    { label: "Show All Windows", onSelect: () => useSystem.getState().showAppWindows(appId) },
    { label: "Hide", onSelect: () => hide(appId) },
    { label: "Quit", onSelect: () => quit(appId) },
  ];
}

export function Dock() {
  const dock = useSettings((s) => s.dock);
  const unpinned = useSettings((s) => s.unpinned);
  const runningIds = useWindows(useShallow((s) => [...new Set(s.wins.map((w) => w.appId))]));
  const minimized = useWindows(useShallow((s) => s.wins.filter((w) => w.minimized).map((w) => w.id)));
  const trashFull = useFs((s) => Object.values(s.nodes).some((n) => n.parentId === TRASH));
  const pointer = useMotionValue(Number.POSITIVE_INFINITY);
  const [revealed, setRevealed] = useState(false);
  const vertical = dock.position !== "bottom";
  const { open, focus } = useWindows.getState();
  const apps = visibleApps().filter((app) => !unpinned.includes(app.id) || runningIds.includes(app.id));

  const place = {
    bottom: "bottom-1 left-1/2 -translate-x-1/2 flex-row items-end",
    left: "left-1 top-1/2 -translate-y-1/2 flex-col items-start",
    right: "right-1 top-1/2 -translate-y-1/2 flex-col items-end",
  }[dock.position];
  const hidden = { bottom: "translate-y-[150%]", left: "-translate-x-[150%]", right: "translate-x-[150%]" }[
    dock.position
  ];
  const hotZone = {
    bottom: "inset-x-0 bottom-0 h-1.5",
    left: "inset-y-0 left-0 w-1.5",
    right: "inset-y-0 right-0 w-1.5",
  }[dock.position];
  const isHidden = dock.autohide && !revealed;

  return (
    <>
      {dock.autohide && <div className={`fixed z-[999] ${hotZone}`} onMouseEnter={() => setRevealed(true)} />}
      <nav
        aria-label="Dock"
        className={`glass fixed z-[999] flex gap-1.5 rounded-[30px] p-[7px] transition-transform duration-300 ${place} ${
          isHidden ? hidden : ""
        }`}
        onMouseMove={(e) => pointer.set(vertical ? e.clientY : e.clientX)}
        onMouseLeave={() => {
          pointer.set(Number.POSITIVE_INFINITY);
          setRevealed(false);
        }}
      >
        <DockItem label="Launchpad" pointer={pointer} onClick={() => useSystem.getState().toggle("launchpad")}>
          <LaunchpadIcon />
        </DockItem>
        {apps.map((app) => (
          <DockItem
            key={app.id}
            label={app.name}
            pointer={pointer}
            running={runningIds.includes(app.id)}
            onClick={() => activateApp(app.id)}
            menu={() => appMenu(app.id)}
          >
            <AppIcon app={app} />
          </DockItem>
        ))}
        <div
          className={`self-stretch bg-black/10 dark:bg-white/15 ${vertical ? "mx-2 my-0.5 h-px" : "mx-0.5 my-2 w-px"}`}
        />
        {minimized.map((id) => (
          <MinimizedItem key={id} id={id} pointer={pointer} onClick={() => focus(id)} />
        ))}
        <DockItem
          label="Trash"
          pointer={pointer}
          onClick={() => open("finder", { dirId: TRASH })}
          menu={() => [
            { label: "Open", onSelect: () => open("finder", { dirId: TRASH }) },
            { label: "Empty Trash", disabled: !trashFull, onSelect: () => useFs.getState().emptyTrash() },
          ]}
          onDrop={(e) => dropInto(e, TRASH)}
        >
          <TrashIcon full={trashFull} />
        </DockItem>
      </nav>
    </>
  );
}

function MinimizedItem({ id, pointer, onClick }: { id: string; pointer: MotionValue<number>; onClick: () => void }) {
  const win = useWindows((s) => s.wins.find((w) => w.id === id));
  if (!win) return null;
  return (
    <DockItem label={win.title} pointer={pointer} onClick={onClick}>
      <div className="relative size-full p-[6%]">
        <div className="size-full overflow-hidden rounded-[5px] bg-[var(--window-solid)] shadow-[0_0_0_0.5px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]">
          <div className="flex gap-[6%] p-[8%]">
            {["#ff5f57", "#febc2e", "#28c840"].map((color) => (
              <span key={color} className="aspect-square w-[12%] rounded-full" style={{ background: color }} />
            ))}
          </div>
        </div>
        <span className="absolute right-0 bottom-0 size-[46%]">
          <AppIcon app={getApp(win.appId)} />
        </span>
      </div>
    </DockItem>
  );
}
