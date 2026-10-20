import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { AppProps } from "../../os/apps";
import { useCommand } from "../../os/windows";
import { Segmented } from "../../ui/Segmented";
import { EventSheet } from "./EventSheet";
import { type CalEvent, isoDate, useCalendar } from "./store";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Weeks start on Monday. */
const mondayOf = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

function EventChip({ event, onOpen }: { event: CalEvent; onOpen: (e: CalEvent) => void }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-1 truncate rounded-[4px] bg-accent/15 px-1.5 py-px text-left text-[11px] hover:bg-accent/25"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(event);
      }}
    >
      <span className="h-2.5 w-[3px] shrink-0 rounded-full bg-accent" />
      <span className="truncate font-medium">{event.title}</span>
      <span className="ml-auto shrink-0 text-muted">{event.time}</span>
    </button>
  );
}

export default function Calendar({ win }: AppProps) {
  const events = useCalendar((s) => s.events);
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const today = isoDate(new Date());

  const firstDay = view === "month" ? mondayOf(new Date(cursor.getFullYear(), cursor.getMonth(), 1)) : mondayOf(cursor);
  const days = Array.from({ length: view === "month" ? 42 : 7 }, (_, i) => addDays(firstDay, i));
  const onDay = (date: Date) =>
    events.filter((e) => e.date === isoDate(date)).sort((a, b) => a.time.localeCompare(b.time));

  const step = (direction: number) =>
    setCursor(
      view === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1)
        : addDays(cursor, 7 * direction),
    );
  const newEvent = (date: string, time = "09:00") =>
    setEditing({ id: crypto.randomUUID(), title: "", date, time, remind: 15, notified: false });

  useCommand(win.id, (command) => {
    if (command === "new-event") newEvent(today);
    if (command === "view-month") setView("month");
    if (command === "view-week") setView("week");
    if (command === "today") setCursor(new Date());
  });

  const dayNumber = (d: Date) => (
    <span
      className={`grid size-[22px] place-items-center rounded-full text-xs ${isoDate(d) === today ? "bg-red-500 font-semibold text-white" : ""}`}
    >
      {d.getDate()}
    </span>
  );

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="titlebar toolbar pl-[84px]">
        <button type="button" aria-label="New event" className="tool" onClick={() => newEvent(today)}>
          <Plus />
        </button>
        <div className="flex flex-1 justify-center">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        </div>
        <button type="button" aria-label="Previous" className="tool" onClick={() => step(-1)}>
          <ChevronLeft />
        </button>
        <button type="button" className="btn" onClick={() => setCursor(new Date())}>
          Today
        </button>
        <button type="button" aria-label="Next" className="tool" onClick={() => step(1)}>
          <ChevronRight />
        </button>
      </div>
      <h2 className="px-5 pb-2 text-[26px]">
        <b>{cursor.toLocaleDateString(undefined, { month: "long" })}</b> {cursor.getFullYear()}
      </h2>
      <div
        className={`grid border-line border-b text-[11px] text-muted ${view === "week" ? "grid-cols-[3rem_repeat(7,1fr)]" : "grid-cols-7"}`}
      >
        {view === "week" && <span />}
        {days.slice(0, 7).map((d) => (
          <span key={d.toISOString()} className="flex items-center justify-end gap-1 px-2 py-1">
            {d.toLocaleDateString(undefined, { weekday: "short" })}
            {view === "week" && dayNumber(d)}
          </span>
        ))}
      </div>
      {view === "month" ? (
        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
          {days.map((d) => {
            const iso = isoDate(d);
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div
                key={iso}
                className={`flex min-h-0 flex-col gap-0.5 overflow-hidden border-line border-r border-b p-1 ${weekend ? "bg-black/[0.02] dark:bg-white/[0.02]" : ""} ${
                  d.getMonth() === cursor.getMonth() ? "" : "text-muted opacity-50"
                }`}
                onDoubleClick={() => newEvent(iso)}
              >
                <span className="flex justify-end">{dayNumber(d)}</span>
                {onDay(d).map((event) => (
                  <EventChip key={event.id} event={event} onOpen={setEditing} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[3rem_repeat(7,1fr)] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <span className="-mt-1.5 h-12 pr-2 text-right text-[10px] text-muted">
                {hour === "00" ? "" : `${hour}:00`}
              </span>
              {days.map((d) => (
                <div
                  key={d.toISOString()}
                  className="h-12 border-line border-t border-l p-0.5"
                  onDoubleClick={() => newEvent(isoDate(d), `${hour}:00`)}
                >
                  {onDay(d)
                    .filter((e) => e.time.startsWith(hour))
                    .map((event) => (
                      <EventChip key={event.id} event={event} onOpen={setEditing} />
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {editing && <EventSheet event={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
