import { AnimatePresence, motion } from "motion/react";
import { getApp } from "../os/apps";
import { type Notice, useNotify } from "../os/notify";
import { useSystem } from "../os/system";
import { AppIcon } from "../ui/AppIcon";
import { Widgets } from "./widgets/Widgets";

function Card({ notice, onClick }: { notice: Notice; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="glass-thick flex w-[340px] items-start gap-3 rounded-[24px] p-3 text-left"
      onClick={onClick}
    >
      <span className="mt-0.5 size-[34px] shrink-0">
        <AppIcon app={getApp(notice.appId)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex justify-between gap-2">
          <b className="truncate font-semibold">{notice.title}</b>
          <span className="shrink-0 text-[11px] text-muted">
            {new Date(notice.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        {notice.body && <span className="line-clamp-2 block">{notice.body}</span>}
      </span>
    </button>
  );
}

/** Transient banners for fresh notifications. */
export function Toasts() {
  const toasts = useNotify((s) => s.toasts);
  const history = useNotify((s) => s.history);
  const dismiss = useNotify((s) => s.dismissToast);
  const shown = history.filter((n) => toasts.includes(n.id));
  return (
    <div className="fixed top-10 right-2 z-[2600] flex flex-col gap-2">
      <AnimatePresence>
        {shown.map((notice) => (
          <motion.div key={notice.id} initial={{ x: 340 }} animate={{ x: 0 }} exit={{ opacity: 0, x: 340 }}>
            <Card notice={notice} onClick={() => dismiss(notice.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Panel opened from the menu bar clock: notification history on top, widgets below. */
export function NotificationCenter() {
  const open = useSystem((s) => s.overlay === "notifications");
  const close = useSystem((s) => s.closeOverlay);
  const history = useNotify((s) => s.history);
  const clear = useNotify((s) => s.clear);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[2000]" onMouseDown={close} />
      <motion.aside
        aria-label="Notification Center"
        initial={{ x: 360 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="fixed top-9 right-2 bottom-2 z-[2001] flex w-[352px] flex-col gap-2 overflow-y-auto p-1.5"
      >
        <div className="flex items-center justify-between px-2 py-1 text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]">
          <h2 className="font-semibold text-[15px]">Notifications</h2>
          {history.length > 0 && (
            <button
              type="button"
              className="glass-thick rounded-full px-2.5 py-0.5 text-fg text-xs [text-shadow:none]"
              onClick={clear}
            >
              Clear All
            </button>
          )}
        </div>
        {history.length === 0 && (
          <p className="glass-thick rounded-[24px] p-5 text-center text-muted">No Notifications</p>
        )}
        {history.map((notice) => (
          <Card key={notice.id} notice={notice} />
        ))}
        <Widgets />
      </motion.aside>
    </>
  );
}
