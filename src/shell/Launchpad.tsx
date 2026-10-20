import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { visibleApps } from "../os/apps";
import { activateApp } from "../os/hotkeys";
import { useSystem } from "../os/system";
import { AppIcon } from "../ui/AppIcon";

function Grid() {
  const [query, setQuery] = useState("");
  const close = useSystem((s) => s.closeOverlay);
  const apps = visibleApps().filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.08 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="fixed inset-0 z-[2000] flex flex-col items-center bg-black/25 pt-14 backdrop-blur-[40px] backdrop-saturate-150"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <label className="glass flex h-8 w-64 items-center gap-2 rounded-full px-3 text-white">
        <Search size={14} className="opacity-70" />
        <input
          // biome-ignore lint/a11y/noAutofocus: Launchpad search is the first thing to type into
          autoFocus
          aria-label="Search apps"
          placeholder="Search"
          className="w-full bg-transparent outline-none placeholder:text-white/60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            const [first] = apps;
            if (e.key === "Enter" && first) {
              close();
              activateApp(first.id);
            }
          }}
        />
      </label>
      <div className="mt-14 grid grid-cols-[repeat(7,8rem)] gap-y-10">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            className="flex flex-col items-center gap-2 font-medium text-white text-xs [text-shadow:0_1px_3px_rgb(0_0_0/0.5)]"
            onClick={() => {
              close();
              activateApp(app.id);
            }}
          >
            <span className="size-[76px] transition-transform active:scale-90 active:brightness-75">
              <AppIcon app={app} />
            </span>
            {app.name}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function Launchpad() {
  return useSystem((s) => s.overlay === "launchpad") ? <Grid /> : null;
}
