import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { notify } from "../../os/notify";

export interface CalEvent {
  id: string;
  title: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Local time, HH:mm. */
  time: string;
  /** Minutes before the start to notify; null for no reminder. */
  remind: number | null;
  notified: boolean;
}

interface CalendarState {
  events: CalEvent[];
  save: (event: CalEvent) => void;
  remove: (id: string) => void;
}

export const useCalendar = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      // Saving re-arms the reminder, since the date or time may have changed.
      save: (event) =>
        set((s) => ({ events: [...s.events.filter((e) => e.id !== event.id), { ...event, notified: false }] })),
      remove: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    }),
    { name: "calendar" },
  ),
);

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOf = (e: CalEvent) => new Date(`${e.date}T${e.time}`).getTime();

const STALE_MS = 60 * 60 * 1000;
const CHECK_MS = 15 * 1000;

/** Runs in the shell (not the Calendar window) so reminders fire even when Calendar is closed. */
export function useReminders() {
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      for (const event of useCalendar.getState().events) {
        const start = startOf(event);
        const due = event.remind !== null && !event.notified && start - event.remind * 60_000 <= now;
        if (!due) continue;
        useCalendar.setState((s) => ({
          events: s.events.map((e) => (e.id === event.id ? { ...e, notified: true } : e)),
        }));
        if (now - start < STALE_MS) notify("calendar", event.title, `${event.date} at ${event.time}`);
      }
    };
    check();
    const timer = setInterval(check, CHECK_MS);
    return () => clearInterval(timer);
  }, []);
}
