import { useEffect, useState } from "react";
import { isoDate, useCalendar } from "../../apps/calendar/store";
import { useWindows } from "../../os/windows";
import { Widget } from "./Widget";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

const HOUR_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);
export function ClockWidget() {
  const now = useNow(1000);
  const city = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replaceAll("_", " ");
  const hand = (deg: number, length: number, width: number, color: string) => (
    <line
      x1="50"
      y1="50"
      x2="50"
      y2={50 - length}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      transform={`rotate(${deg} 50 50)`}
    />
  );
  const [h, m, s] = [now.getHours() % 12, now.getMinutes(), now.getSeconds()];
  return (
    <Widget className="flex flex-col items-center p-2.5">
      <svg viewBox="0 0 100 100" className="size-[104px]" aria-label={now.toLocaleTimeString()}>
        <circle cx="50" cy="50" r="48" className="fill-white dark:fill-[#1c1c1e]" />
        {HOUR_ANGLES.map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="8"
            x2="50"
            y2="13"
            className="stroke-black/60 dark:stroke-white/70"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        {hand(h * 30 + m / 2, 24, 4, "currentColor")}
        {hand(m * 6, 34, 3, "currentColor")}
        {hand(s * 6, 38, 1.2, "#ff9500")}
        <circle cx="50" cy="50" r="2.5" fill="#ff9500" />
      </svg>
      <span className="mt-1 font-semibold text-[11px]">{city}</span>
    </Widget>
  );
}
export function UpNextWidget() {
  const now = useNow(60_000);
  const today = isoDate(now);
  const time = now.toTimeString().slice(0, 5);
  // Only events still ahead today; times are HH:mm, so string order is time order.
  const next = useCalendar(
    (c) => c.events.filter((e) => e.date === today && e.time >= time).sort((a, b) => a.time.localeCompare(b.time))[0],
  );
  return (
    <Widget>
      <button
        type="button"
        className="flex size-full flex-col text-left"
        onClick={() => useWindows.getState().open("calendar")}
      >
        <span className="font-semibold text-[#ff3b30] text-[11px] uppercase">
          {now.toLocaleDateString(undefined, { weekday: "long" })}
        </span>
        <span className="font-light text-[40px] leading-none">{now.getDate()}</span>
        <span className="mt-auto truncate font-semibold text-[12px]">{next?.title ?? "No more events"}</span>
        <span className="text-[11px] text-muted">{next ? next.time : "today"}</span>
      </button>
    </Widget>
  );
}
