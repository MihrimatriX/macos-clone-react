import { getApp } from "../os/apps";
import { activateApp, switcherApps } from "../os/hotkeys";
import { useSystem } from "../os/system";
import { AppIcon } from "../ui/AppIcon";

/** ⌘Tab overlay; hotkeys.ts moves the index while ⌘ is held and activates on release. */
export function AppSwitcher() {
  const index = useSystem((s) => s.switcher);
  if (index === null) return null;
  const apps = switcherApps().map(getApp);
  return (
    <div className="glass fixed top-1/2 left-1/2 z-[2500] flex -translate-x-1/2 -translate-y-1/2 gap-1 rounded-[32px] p-3 [--blur:28px]">
      {apps.map((app, i) => (
        <button
          key={app.id}
          type="button"
          aria-label={app.name}
          className={`flex w-[104px] flex-col items-center gap-1.5 rounded-[18px] p-3 ${i === index ? "bg-black/15 dark:bg-white/15" : ""}`}
          onClick={() => {
            useSystem.getState().setSwitcher(null);
            activateApp(app.id);
          }}
        >
          <span className="size-20">
            <AppIcon app={app} />
          </span>
          <span className={`text-xs ${i === index ? "" : "invisible"}`}>{app.name}</span>
        </button>
      ))}
    </div>
  );
}
