import type { CSSProperties } from "react";

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Thick Control Center style track. */
  large?: boolean;
  className?: string;
  onChange: (value: number) => void;
}

/** Range input with a filled track; the fill ends at the thumb's centre, which travels inset by half its width. */
export function Slider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  large = false,
  className = "",
  onChange,
}: Props) {
  const thumb = large ? 24 : 22;
  const ratio = (value - min) / (max - min || 1);
  const fill = `calc(${thumb / 2}px + (100% - ${thumb}px) * ${ratio})`;
  return (
    <input
      type="range"
      aria-label={label}
      className={`${large ? "slider-lg" : "slider"} ${className}`}
      style={{ "--fill": fill } as CSSProperties}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
