import { Power } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useFs } from "../os/fs";
import { useSystem } from "../os/system";
import { Logo } from "../ui/AppIcons";

const BOOT_MS = 1600;

const fsReady = () =>
  new Promise<void>((done) => {
    if (useFs.persist.hasHydrated()) done();
    else useFs.persist.onFinishHydration(() => done());
  });

/** Startup screen; the progress bar waits for the file system to load from IndexedDB. */
export function Boot() {
  const setPhase = useSystem((s) => s.setPhase);
  useEffect(() => {
    let cancelled = false;
    Promise.all([fsReady(), new Promise((r) => setTimeout(r, BOOT_MS))]).then(() => !cancelled && setPhase("login"));
    return () => {
      cancelled = true;
    };
  }, [setPhase]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-12 bg-black text-white">
      <Logo size={80} />
      <div className="h-1 w-48 overflow-hidden rounded-full bg-white/25">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: BOOT_MS / 1000, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

/** Shut down and sleep are both a black screen; they differ in what waking leads to. */
export function Dark({ phase }: { phase: "off" | "sleep" }) {
  const setPhase = useSystem((s) => s.setPhase);
  const wake = () => setPhase(phase === "off" ? "boot" : "login");
  useEffect(() => {
    if (phase !== "sleep") return;
    const wakeUp = () => setPhase("login");
    window.addEventListener("keydown", wakeUp);
    return () => window.removeEventListener("keydown", wakeUp);
  }, [phase, setPhase]);

  return (
    <button
      type="button"
      aria-label={phase === "off" ? "Power on" : "Wake"}
      className="fixed inset-0 flex cursor-default items-center justify-center bg-black text-white/30"
      onClick={wake}
    >
      {phase === "off" && (
        <span className="flex flex-col items-center gap-3 hover:text-white/70">
          <Power size={40} />
          Click to start up
        </span>
      )}
    </button>
  );
}
