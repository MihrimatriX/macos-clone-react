import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Modal panel that drops from beneath a window's title bar, scoped to that window.
 * Unified windows set --sheet-top so the sheet clears their 52px toolbar.
 */
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex justify-center bg-black/15 pt-[var(--sheet-top,0px)]">
      <motion.div
        role="dialog"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="glass-thick mt-2 h-fit w-[360px] max-w-[92%] rounded-[24px] p-5"
      >
        {children}
      </motion.div>
    </div>
  );
}
