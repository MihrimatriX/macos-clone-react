import type { ReactNode } from "react";

interface Option<T> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is only a glyph. */
  title?: string;
}

/** Tahoe segmented control: a capsule track with the selected segment as a raised capsule. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented inline-flex h-6 shrink-0 rounded-full bg-hover p-[2px]">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.title}
          aria-pressed={option.value === value}
          className={`flex min-w-9 items-center justify-center rounded-full px-2.5 text-xs transition-colors [&_svg]:size-[15px] ${
            option.value === value ? "bg-control text-fg shadow-[var(--control-shadow)]" : "text-muted hover:text-fg"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
