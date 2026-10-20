import { Sheet } from "../../ui/Sheet";
import { type CalEvent, useCalendar } from "./store";

const REMINDERS: [string, number | null][] = [
  ["None", null],
  ["At time of event", 0],
  ["5 minutes before", 5],
  ["15 minutes before", 15],
  ["30 minutes before", 30],
  ["1 hour before", 60],
];

/** Create/edit form; `event.id` already exists in the store when editing. */
export function EventSheet({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  const { save, remove } = useCalendar.getState();
  const existing = useCalendar((s) => s.events.some((e) => e.id === event.id));

  return (
    <Sheet>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const remind = String(data.get("remind"));
          save({
            ...event,
            title: String(data.get("title")).trim() || "New Event",
            date: String(data.get("date")),
            time: String(data.get("time")),
            remind: remind === "" ? null : Number(remind),
          });
          onClose();
        }}
      >
        <input
          name="title"
          aria-label="Title"
          // biome-ignore lint/a11y/noAutofocus: the sheet exists to edit this field
          autoFocus
          placeholder="New Event"
          defaultValue={event.title}
          className="field font-semibold"
        />
        <div className="flex gap-2">
          <input
            name="date"
            aria-label="Date"
            type="date"
            required
            defaultValue={event.date}
            className="field flex-1"
          />
          <input name="time" aria-label="Time" type="time" required defaultValue={event.time} className="field" />
        </div>
        <select name="remind" aria-label="Reminder" defaultValue={event.remind ?? ""} className="popup">
          {REMINDERS.map(([label, minutes]) => (
            <option key={label} value={minutes ?? ""}>
              Alert: {label}
            </option>
          ))}
        </select>
        <div className="mt-2 flex gap-2">
          {existing && (
            <button
              type="button"
              className="btn mr-auto text-red-500"
              onClick={() => {
                remove(event.id);
                onClose();
              }}
            >
              Delete
            </button>
          )}
          <button type="button" className="btn ml-auto" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Save
          </button>
        </div>
      </form>
    </Sheet>
  );
}
