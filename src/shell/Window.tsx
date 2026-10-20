import { ChevronsLeftRight, Minus, X } from "lucide-react";
import { motion } from "motion/react";
import { type CSSProperties, Suspense, useState, useSyncExternalStore } from "react";
import { Rnd } from "react-rnd";
import { getApp } from "../os/apps";
import { useSettings } from "../os/settings";
import { useSystem } from "../os/system";
import { sendCommand, useWindows } from "../os/windows";
import { Sheet } from "../ui/Sheet";

/** Height of the menu bar; notched displays use a taller bar that matches the notch. */
export const MENU_H = 32;
/** Pointer-downs on these never start a window drag. */
const INTERACTIVE = "button, input, select, textarea, a, [contenteditable], .no-drag";

const onResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

/** Screen area not covered by the menu bar or a visible Dock; maximize and snapping fill this. */
function useWorkArea() {
  const dock = useSettings((s) => s.dock);
  const vw = useSyncExternalStore(onResize, () => window.innerWidth);
  const vh = useSyncExternalStore(onResize, () => window.innerHeight);
  const gap = dock.autohide ? 0 : dock.size + 16;
  const side = dock.position === "bottom" ? 0 : gap;
  return {
    x: dock.position === "left" ? gap : 0,
    y: MENU_H,
    w: vw - side,
    h: vh - MENU_H - (dock.position === "bottom" ? gap : 0),
  };
}

type Rect = ReturnType<typeof useWorkArea>;

/** Where minimized windows fly to, as a fraction of the viewport. */
const DOCK_ANCHOR = { bottom: [0.5, 1], left: [0, 0.5], right: [1, 0.5] } as const;

function edgeAt(x: number) {
  if (x <= 2) return "left";
  if (x >= window.innerWidth - 3) return "right";
  return null;
}

function missionTransform(index: number, count: number, area: Rect, rect: Rect) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = area.w / cols;
  const cellH = (area.h - 40) / rows;
  const scale = Math.min((cellW * 0.86) / rect.w, (cellH * 0.86) / rect.h, 1);
  const cx = area.x + cellW * ((index % cols) + 0.5);
  const cy = area.y + 40 + cellH * (Math.floor(index / cols) + 0.5);
  return { x: cx - (rect.x + rect.w / 2), y: cy - (rect.y + rect.h / 2), scale, opacity: 1 };
}

export function Window({ id, missionIndex, missionCount }: { id: string; missionIndex: number; missionCount: number }) {
  const win = useWindows((s) => s.wins.find((w) => w.id === id));
  const active = useWindows((s) => s.focusedId === id);
  const mission = useSystem((s) => s.overlay === "mission");
  const dockPosition = useSettings((s) => s.dock.position);
  const area = useWorkArea();
  const [snap, setSnap] = useState<"left" | "right" | null>(null);
  if (!win) return null;

  const { focus, update, requestClose, minimize, toggleMax, close } = useWindows.getState();
  const app = getApp(win.appId);
  const rect = win.maximized ? area : win;
  const half = { x: snap === "right" ? area.x + area.w / 2 : area.x, y: area.y, w: area.w / 2, h: area.h };

  let animate = { x: 0, y: 0, scale: 1, opacity: 1 };
  if (win.minimized) {
    const [ax, ay] = DOCK_ANCHOR[dockPosition];
    const dx = window.innerWidth * ax - (rect.x + rect.w / 2);
    animate = { x: dx, y: window.innerHeight * ay - (rect.y + rect.h / 2), scale: 0.08, opacity: 0 };
  } else if (win.hidden || (mission && missionIndex < 0)) {
    // Hidden apps, and other apps during App Exposé, fade out in place.
    animate = { x: 0, y: 0, scale: 0.96, opacity: 0 };
  } else if (mission) {
    animate = missionTransform(missionIndex, missionCount, area, rect);
  }

  return (
    <>
      {snap && (
        <div
          className="glass pointer-events-none fixed rounded-[26px]"
          style={{ left: half.x, top: half.y, width: half.w, height: half.h, zIndex: win.z }}
        />
      )}
      <Rnd
        position={{ x: rect.x, y: rect.y }}
        size={{ width: rect.w, height: rect.h }}
        minWidth={app.minSize.w}
        minHeight={app.minSize.h}
        dragHandleClassName="titlebar"
        cancel={INTERACTIVE}
        disableDragging={win.maximized || mission}
        enableResizing={!win.maximized && !mission}
        style={{
          zIndex: win.z,
          pointerEvents: win.minimized || win.hidden || (mission && missionIndex < 0) ? "none" : "auto",
        }}
        onDragStart={() => document.body.classList.add("dragging")}
        onResizeStart={() => document.body.classList.add("dragging")}
        onDrag={(e) => setSnap("clientX" in e ? edgeAt(e.clientX) : null)}
        onDragStop={(_e, d) => {
          document.body.classList.remove("dragging");
          if (snap) update(id, half);
          else update(id, { x: d.x, y: Math.max(MENU_H, d.y) });
          setSnap(null);
        }}
        onResizeStop={(_e, _dir, el, _delta, pos) => {
          document.body.classList.remove("dragging");
          update(id, { w: el.offsetWidth, h: el.offsetHeight, ...pos });
        }}
      >
        <motion.div
          className="window"
          data-active={active}
          data-unified={app.unified ?? false}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={animate}
          transition={{ duration: win.minimized ? 0.45 : 0.28, ease: [0.32, 0.72, 0, 1] }}
          onDoubleClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest(".titlebar") && !target.closest(INTERACTIVE)) toggleMax(id);
          }}
          onPointerDownCapture={(e) => {
            if (mission) {
              e.stopPropagation();
              useSystem.getState().closeOverlay();
            }
            if (!active || mission) focus(id);
          }}
        >
          <div
            className={`traffic absolute z-20 flex gap-2 ${app.unified ? "top-[21px] left-[21px]" : "top-2 left-2.5"}`}
          >
            <button type="button" aria-label="Close" className="light bg-[#ff5f57]" onClick={() => requestClose(id)}>
              {win.dirty ? <span className="size-1.5 rounded-full bg-black/45" /> : <X />}
            </button>
            <button type="button" aria-label="Minimize" className="light bg-[#febc2e]" onClick={() => minimize(id)}>
              <Minus />
            </button>
            <button type="button" aria-label="Zoom" className="light bg-[#28c840]" onClick={() => toggleMax(id)}>
              <ChevronsLeftRight className="rotate-45" />
            </button>
          </div>
          {!app.unified && (
            <div className="titlebar flex h-7 shrink-0 items-center justify-center px-20">
              <span className="truncate font-semibold text-[13px] text-muted">{win.title}</span>
            </div>
          )}
          <div
            className="relative min-h-0 flex-1"
            style={{ "--sheet-top": app.unified ? "52px" : "0px" } as CSSProperties}
          >
            <Suspense fallback={null}>
              <app.component win={win} />
            </Suspense>
            {win.confirmClose && (
              <Sheet>
                <p className="mb-1 font-semibold">
                  Do you want to save the changes to “{win.title.replace(/ — Edited$/, "")}”?
                </p>
                <p className="mb-4 text-muted text-xs">Your changes will be lost if you don’t save them.</p>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn mr-auto" onClick={() => close(id)}>
                    Don’t Save
                  </button>
                  <button type="button" className="btn" onClick={() => update(id, { confirmClose: false })}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      update(id, { confirmClose: false });
                      sendCommand(id, "save-and-close");
                    }}
                  >
                    Save
                  </button>
                </div>
              </Sheet>
            )}
          </div>
        </motion.div>
      </Rnd>
    </>
  );
}
