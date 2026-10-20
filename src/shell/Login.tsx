import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { activateApp } from "../os/hotkeys";
import { useIsDark, useSettings } from "../os/settings";
import { useSystem } from "../os/system";
import { WALLPAPERS } from "../os/wallpapers";
import { Avatar } from "../ui/Avatar";

export function Login() {
  const userName = useSettings((s) => s.userName);
  const wallpaper = useSettings((s) => WALLPAPERS[s.wallpaper] ?? WALLPAPERS[0]);
  const dark = useIsDark();
  const setPhase = useSystem((s) => s.setPhase);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden text-white">
      <div className="absolute -inset-8 blur-xl" style={{ background: dark ? wallpaper?.dark : wallpaper?.light }} />
      <div className="relative flex h-full flex-col items-center justify-between py-[12vh] [text-shadow:0_1px_4px_rgb(0_0_0/0.4)]">
        <div className="text-center">
          <p className="font-medium text-xl">
            {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="font-bold text-8xl tracking-tight">
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <form
          className="flex flex-col items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setPhase("desktop");
            for (const appId of useSettings.getState().loginItems) activateApp(appId);
          }}
        >
          <Avatar size={72} />
          <p className="font-semibold text-base">{userName}</p>
          <div className="relative">
            <input
              // biome-ignore lint/a11y/noAutofocus: the password field is the only control on this screen
              autoFocus
              type="password"
              aria-label="Password"
              placeholder="Enter Password"
              className="glass w-52 rounded-full px-4 py-1.5 text-white outline-none placeholder:text-white/70"
            />
            <button
              type="submit"
              aria-label="Log in"
              className="absolute top-1.5 right-1.5 rounded-full bg-white/30 p-0.5"
            >
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="text-white/70 text-xs">Any password works — press Enter</p>
        </form>
      </div>
    </div>
  );
}
