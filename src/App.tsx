import { useEffect, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import { useReminders } from "./apps/calendar/store";
import { useHotkeys } from "./os/hotkeys";
import { useIsDark, useSettings } from "./os/settings";
import { useSystem } from "./os/system";
import { useWindows } from "./os/windows";
import { AppSwitcher } from "./shell/AppSwitcher";
import { Boot, Dark } from "./shell/Boot";
import { ContextMenu } from "./shell/ContextMenu";
import { ControlCenter } from "./shell/ControlCenter";
import { Desktop } from "./shell/Desktop";
import { Dock } from "./shell/Dock";
import { Launchpad } from "./shell/Launchpad";
import { Login } from "./shell/Login";
import { MenuBar } from "./shell/MenuBar";
import { MissionControl } from "./shell/MissionControl";
import { NotificationCenter, Toasts } from "./shell/Notifications";
import { Spotlight } from "./shell/Spotlight";
import { Window } from "./shell/Window";

/** Camera housing of notched MacBooks. It is hardware, so it sits above every screen and phase. */
function Notch() {
  return (
    <div
      aria-hidden="true"
      className="notch pointer-events-none fixed top-0 left-1/2 z-[9999] h-8 w-[196px] -translate-x-1/2 rounded-b-[12px] bg-black"
    >
      {/* Camera lens: a dark glass disc with a faint violet reflection, set in a slightly lighter ring. */}
      <span className="absolute top-1/2 left-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#4b5a8a_0%,#151a2c_45%,#05060a_75%)] shadow-[0_0_0_1.5px_#16161b]" />
    </div>
  );
}

function WindowLayer() {
  const ids = useWindows(useShallow((s) => s.wins.map((w) => w.id)));
  const expose = useSystem((s) => s.expose);
  const visible = useWindows(
    useShallow((s) =>
      s.wins.filter((w) => !w.minimized && !w.hidden && (!expose || w.appId === expose)).map((w) => w.id),
    ),
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {ids.map((id) => (
        <Window key={id} id={id} missionIndex={visible.indexOf(id)} missionCount={visible.length} />
      ))}
    </div>
  );
}

const onResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};

function Session() {
  const phase = useSystem((s) => s.phase);
  if (phase === "boot") return <Boot />;
  if (phase === "login") return <Login />;
  if (phase === "off" || phase === "sleep") return <Dark phase={phase} />;
  return (
    <>
      <Desktop />
      <MissionControl />
      <WindowLayer />
      <MenuBar />
      <Dock />
      <Launchpad />
      <Spotlight />
      <ControlCenter />
      <NotificationCenter />
      <Toasts />
      <AppSwitcher />
      <ContextMenu />
    </>
  );
}

export function App() {
  const dark = useIsDark();
  const accent = useSettings((s) => s.accent);
  const brightness = useSettings((s) => s.brightness);
  const narrow = useSyncExternalStore(onResize, () => window.innerWidth < 1024);
  useHotkeys();
  useReminders();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
  }, [accent]);

  return (
    <div
      // Notched displays round their top corners.
      className="fixed inset-0 overflow-hidden rounded-t-[12px]"
      style={{ filter: brightness < 1 ? `brightness(${brightness})` : undefined }}
    >
      <Session />
      <Notch />
      {narrow && (
        <div className="fixed inset-x-0 bottom-0 z-[5000] bg-amber-400 py-1 text-center text-black text-xs">
          Best experienced on a desktop screen (1024px or wider).
        </div>
      )}
    </div>
  );
}
