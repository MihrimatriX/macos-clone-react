import { motion } from "motion/react";
import { getApp } from "../os/apps";
import { useSystem } from "../os/system";

/**
 * Backdrop only: the live windows lay themselves out in a grid (see missionTransform in Window.tsx),
 * so Mission Control shows real content instead of screenshots.
 */
export function MissionControl() {
  const active = useSystem((s) => s.overlay === "mission");
  const close = useSystem((s) => s.closeOverlay);
  const expose = useSystem((s) => s.expose);
  if (!active) return null;
  return (
    <motion.button
      type="button"
      aria-label="Close Mission Control"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[5] cursor-default bg-black/40 backdrop-blur-md"
      onClick={close}
    >
      <span className="absolute top-10 left-1/2 -translate-x-1/2 text-sm text-white/80">
        {expose ? getApp(expose).name : "Desktop"}
      </span>
    </motion.button>
  );
}
