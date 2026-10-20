import { type ReactNode, useId } from "react";

/*
 * Hand-drawn app icons on a 100×100 grid, in the layered Tahoe style: a full-bleed backdrop and a few
 * soft-shaded foreground shapes. .app-icon clips them to the squircle and adds the glass rim.
 * Every icon can appear many times at once (Dock, Launchpad, Finder), so gradient ids come from useId.
 */

/** useId output contains ":" which breaks url(#…) references. */
const useUid = () => useId().replace(/[^\w]/g, "");

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
      {children}
    </svg>
  );
}

function Fill({ id, from, to }: { id: string; from: string; to: string }) {
  return (
    <linearGradient id={id} x2="0" y2="1">
      <stop offset="0" stopColor={from} />
      <stop offset="1" stopColor={to} />
    </linearGradient>
  );
}

export function FinderIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}l`} from="#3fb5ff" to="#0a64eb" />
      <Fill id={`${u}r`} from="#f4f9ff" to="#cfe5ff" />
      <rect width="100" height="100" fill={`url(#${u}r)`} />
      <path d="M0 0h55c-4 15-8 30-10 47h8c-2 18-1 35 2 53H0z" fill={`url(#${u}l)`} />
      <g fill="#0d2d5c">
        <rect x="27" y="27" width="6.5" height="17" rx="3.25" />
        <rect x="66" y="27" width="6.5" height="17" rx="3.25" />
      </g>
      <path d="M23 67c15 11 39 11 54-1" fill="none" stroke="#0d2d5c" strokeWidth="4.5" strokeLinecap="round" />
    </Svg>
  );
}

export function TerminalIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}b`} from="#4a4a50" to="#141416" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <rect x="13" y="16" width="74" height="68" rx="11" fill="#000" fillOpacity=".35" />
      <rect x="13.5" y="16.5" width="73" height="67" rx="10.5" fill="none" stroke="#fff" strokeOpacity=".14" />
      <g fill="none" stroke="#f2f2f2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 38l11 10-11 10" />
        <path d="M45 60h20" stroke="#8ef0a5" />
      </g>
    </Svg>
  );
}

export function TextEditIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}b`} from="#f5f5f7" to="#d4d4da" />
      <Fill id={`${u}p`} from="#ffffff" to="#f1f1f4" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <rect x="23" y="15" width="54" height="72" rx="5" fill="#000" fillOpacity=".12" transform="translate(0 2)" />
      <rect x="23" y="15" width="54" height="72" rx="5" fill={`url(#${u}p)`} />
      <g stroke="#c4c4cc" strokeWidth="2.5" strokeLinecap="round">
        <path d="M31 30h38" stroke="#8e8e96" />
        {[39, 47, 55, 63].map((y) => (
          <path key={y} d={`M31 ${y}h${y === 63 ? 22 : 38}`} />
        ))}
      </g>
      <g transform="rotate(38 70 62)">
        <rect x="66" y="34" width="8" height="40" rx="2" fill="#2f6fed" />
        <rect x="66" y="34" width="8" height="7" rx="2" fill="#1c1c1e" />
        <path d="M66 74h8l-4 9z" fill="#f2d7a6" />
        <path d="M68.7 80h2.6L70 83z" fill="#1c1c1e" />
      </g>
    </Svg>
  );
}

export function SafariIcon() {
  const u = useUid();
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <Svg>
      <Fill id={`${u}b`} from="#ffffff" to="#e2e2e8" />
      <Fill id={`${u}d`} from="#5ed0ff" to="#0b5fe6" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <circle cx="50" cy="50" r="38" fill={`url(#${u}d)`} />
      <circle cx="50" cy="50" r="37.5" fill="none" stroke="#fff" strokeOpacity=".35" />
      <g stroke="#fff" strokeOpacity=".8" strokeLinecap="round">
        {ticks.map((deg) => (
          <path
            key={deg}
            d={deg % 90 === 0 ? "M50 15v6" : "M50 15v3"}
            strokeWidth={deg % 90 === 0 ? 1.6 : 1}
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
      </g>
      <g transform="rotate(45 50 50)">
        <path d="M50 20l6 30H44z" fill="#ff3b30" />
        <path d="M50 80l-6-30h12z" fill="#fff" />
      </g>
      <circle cx="50" cy="50" r="2.5" fill="#fff" />
    </Svg>
  );
}

export function NotesIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}t`} from="#ffe066" to="#ffc300" />
      <rect width="100" height="100" fill="#fdfdfb" />
      <rect width="100" height="30" fill={`url(#${u}t)`} />
      <path d="M0 30h100" stroke="#000" strokeOpacity=".12" strokeWidth="1" strokeDasharray="2 3" />
      <g stroke="#d9d6cc" strokeWidth="2">
        {[46, 60, 74, 88].map((y) => (
          <path key={y} d={`M10 ${y}h80`} />
        ))}
      </g>
    </Svg>
  );
}

export function PreviewIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}b`} from="#e8f2ff" to="#b9d7ff" />
      <Fill id={`${u}s`} from="#7cc8ff" to="#d8efff" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <rect x="22" y="20" width="58" height="50" rx="5" fill="#fff" transform="rotate(-9 51 45)" opacity=".7" />
      <g transform="rotate(5 50 54)">
        <rect x="18" y="26" width="64" height="54" rx="5" fill="#000" fillOpacity=".12" transform="translate(0 2)" />
        <rect x="18" y="26" width="64" height="54" rx="5" fill="#fff" />
        <rect x="23" y="31" width="54" height="44" rx="2" fill={`url(#${u}s)`} />
        <circle cx="64" cy="43" r="6" fill="#ffd60a" />
        <path d="M23 75l17-22 12 14 8-9 17 17z" fill="#34c759" />
        <path d="M23 75l17-22 8 9-14 13z" fill="#248a3d" />
      </g>
    </Svg>
  );
}

export function MusicIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}b`} from="#ff6a7f" to="#f5213e" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <g fill="#fff">
        <path d="M41 30l35-8v9l-35 8z" />
        <rect x="41" y="30" width="5" height="40" rx="1" />
        <rect x="71" y="22" width="5" height="40" rx="1" />
        <ellipse cx="36" cy="70" rx="10" ry="7.5" transform="rotate(-20 36 70)" />
        <ellipse cx="66" cy="62" rx="10" ry="7.5" transform="rotate(-20 66 62)" />
      </g>
    </Svg>
  );
}

/** Shows today's weekday and date, like the real Calendar icon. */
export function CalendarIcon() {
  const now = new Date();
  return (
    <Svg>
      <rect width="100" height="100" fill="#fff" />
      <text
        x="50"
        y="30"
        textAnchor="middle"
        fill="#ff3b30"
        fontSize="15"
        fontWeight="600"
        fontFamily="var(--font-sans)"
      >
        {now.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()}
      </text>
      <text
        x="50"
        y="80"
        textAnchor="middle"
        fill="#1c1c1e"
        fontSize="54"
        fontWeight="300"
        fontFamily="var(--font-sans)"
      >
        {now.getDate()}
      </text>
    </Svg>
  );
}

export function CalculatorIcon() {
  const u = useUid();
  const keys = Array.from({ length: 16 }, (_, i) => ({ col: i % 4, row: Math.floor(i / 4) }));
  return (
    <Svg>
      <Fill id={`${u}b`} from="#4a4a4f" to="#1c1c1e" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      {keys.map(({ col, row }) => {
        let color = "#5b5b60";
        if (col === 3) color = "#ff9f0a";
        else if (row === 0) color = "#b4b4b9";
        return <circle key={`${col}${row}`} cx={23 + col * 18} cy={23 + row * 18} r="7.5" fill={color} />;
      })}
    </Svg>
  );
}

/** Square-toothed gear outline centred on 50,50. */
function gear(outer: number, inner: number, teeth: number) {
  const points = Array.from({ length: teeth * 4 }, (_, i) => {
    const angle = ((i + 0.5) / (teeth * 4)) * Math.PI * 2;
    const r = i % 4 < 2 ? outer : inner;
    return `${(50 + r * Math.cos(angle)).toFixed(2)} ${(50 + r * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join("L")}Z`;
}

export function SettingsIcon() {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}b`} from="#d9d9de" to="#8e8e94" />
      <Fill id={`${u}g`} from="#6c6c72" to="#2c2c30" />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <path d={gear(38, 31, 14)} fill={`url(#${u}g)`} />
      <circle cx="50" cy="50" r="24" fill="#e6e6ea" />
      <path d={gear(18, 14, 10)} fill={`url(#${u}g)`} />
      <circle cx="50" cy="50" r="7" fill="#e6e6ea" />
    </Svg>
  );
}

function InfoGlyph({ from, to }: { from: string; to: string }) {
  const u = useUid();
  return (
    <Svg>
      <Fill id={`${u}b`} from={from} to={to} />
      <rect width="100" height="100" fill={`url(#${u}b)`} />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" strokeWidth="5" />
      <circle cx="50" cy="36" r="4" fill="#fff" />
      <rect x="46.5" y="45" width="7" height="22" rx="3.5" fill="#fff" />
    </Svg>
  );
}

export const InfoIcon = () => <InfoGlyph from="#b8b8bf" to="#6b6b72" />;
export const AboutIcon = () => <InfoGlyph from="#62a8ff" to="#1f62e0" />;

const LAUNCHPAD_DOTS = [
  "#ff5f57",
  "#ff9f0a",
  "#ffd60a",
  "#34c759",
  "#0a84ff",
  "#bf5af2",
  "#ff375f",
  "#30d5c8",
  "#5e5ce6",
];

export function LaunchpadIcon() {
  const u = useUid();
  return (
    <div className="app-icon">
      <Svg>
        <Fill id={`${u}b`} from="#f2f2f6" to="#c9c9d1" />
        <rect width="100" height="100" fill={`url(#${u}b)`} />
        {LAUNCHPAD_DOTS.map((color, i) => (
          <rect
            key={color}
            x={20 + (i % 3) * 22}
            y={20 + Math.floor(i / 3) * 22}
            width="16"
            height="16"
            rx="5"
            fill={color}
          />
        ))}
      </Svg>
    </div>
  );
}

/** Frosted glass bin; crumpled paper shows through when the Trash has items. */
export function TrashIcon({ full }: { full: boolean }) {
  const u = useUid();
  return (
    <svg viewBox="0 0 64 64" className="size-full drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)]" aria-hidden="true">
      <defs>
        <linearGradient id={`${u}g`} x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#d6d6de" stopOpacity=".55" />
        </linearGradient>
      </defs>
      {full && (
        <g fill="#fff" stroke="#c8c8cf" strokeWidth=".6">
          <path d="M20 26l7-8 8 3 2 7-10 4z" />
          <path d="M31 22l8-8 8 4-1 9-11 1z" />
          <path d="M22 36l9-3 6 5-4 6-9-2z" />
        </g>
      )}
      <path
        d="M14 18h36l-3.4 38.5a4 4 0 0 1-4 3.5H21.4a4 4 0 0 1-4-3.5z"
        fill={`url(#${u}g)`}
        stroke="#fff"
        strokeOpacity=".9"
        strokeWidth=".8"
      />
      <g stroke="#fff" strokeOpacity=".7" strokeWidth="1.2">
        {[23, 29, 35, 41].map((x) => (
          <path key={x} d={`M${x} 23l${(x - 32) * 0.08} 32`} />
        ))}
      </g>
      <rect
        x="11"
        y="13.5"
        width="42"
        height="6"
        rx="3"
        fill="#f4f4f7"
        fillOpacity=".9"
        stroke="#fff"
        strokeWidth=".8"
      />
    </svg>
  );
}

/**
 * System logo: a plain fruit silhouette with a leaf. It is symmetric and has no bite, so it nods to the
 * real menu bar without copying Apple's trademark.
 */
export function Logo({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 7.3c-1.3-1-2.7-1.4-4-1.2C5.3 6.5 3.6 9 3.8 12.4c.2 3.6 2.4 8.1 5 8.5.9.1 1.6-.3 2.2-.5.6-.2 1.4-.2 2 0 .6.2 1.3.6 2.2.5 2.6-.4 4.8-4.9 5-8.5.2-3.4-1.5-5.9-4.2-6.3-1.3-.2-2.7.2-4 1.2z" />
      <path d="M12.5 5.7c.1-2 1.4-3.5 3.5-3.9-.1 2-1.4 3.6-3.5 3.9z" />
    </svg>
  );
}
