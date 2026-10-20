import {
  AppWindow,
  CircleArrowDown,
  FileText,
  House,
  Image,
  type LucideIcon,
  Monitor,
  Music,
  Trash2,
} from "lucide-react";
import { type ReactNode, useId } from "react";
import { getApp } from "../os/apps";
import { APPLICATIONS, DESKTOP, displayName, type FsNode, fileUrl, HOME, TRASH } from "../os/fs";
import { AppIcon } from "./AppIcon";

const FOLDER_GLYPHS: Record<string, LucideIcon> = {
  [HOME]: House,
  [APPLICATIONS]: AppWindow,
  [DESKTOP]: Monitor,
  Documents: FileText,
  Downloads: CircleArrowDown,
  Pictures: Image,
  Music,
};

/** Two-tone macOS folder; well-known folders get an embossed glyph. */
function FolderIcon({ glyph: Glyph }: { glyph?: LucideIcon }) {
  // useId contains characters that are not valid inside url(#…).
  const id = useId().replace(/[^\w]/g, "");
  return (
    <div className="relative size-full">
      <svg viewBox="0 0 64 56" className="size-full drop-shadow-[0_1px_1px_rgb(0_0_0/0.18)]" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}b`} x2="0" y2="1">
            <stop offset="0" stopColor="#5aaef0" />
            <stop offset="1" stopColor="#3a8fde" />
          </linearGradient>
          <linearGradient id={`${id}f`} x2="0" y2="1">
            <stop offset="0" stopColor="#92d3ff" />
            <stop offset="1" stopColor="#62b7f6" />
          </linearGradient>
        </defs>
        <path
          d="M3 10a4 4 0 0 1 4-4h15.4a4 4 0 0 1 2.9 1.2L28.2 10H57a4 4 0 0 1 4 4v34a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"
          fill={`url(#${id}b)`}
        />
        <path d="M3 19a4 4 0 0 1 4-4h50a4 4 0 0 1 4 4v29a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" fill={`url(#${id}f)`} />
        <path d="M7 15.5h50" stroke="white" strokeOpacity=".45" />
      </svg>
      {Glyph && (
        <Glyph
          className="absolute top-[60%] left-1/2 size-[32%] -translate-x-1/2 -translate-y-1/2 text-[#2f7fc8] opacity-60"
          strokeWidth={2.25}
        />
      )}
    </div>
  );
}

/** Sheet of paper with a folded corner; `children` is drawn on the page. */
function PaperIcon({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="@container relative mx-auto aspect-[4/5] h-full">
      <svg
        viewBox="0 0 48 60"
        className="absolute inset-0 size-full drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.22)]"
        aria-hidden="true"
      >
        <path d="M4 3a3 3 0 0 1 3-3h24l13 13v44a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#fff" />
        <path d="M31 0v10a3 3 0 0 0 3 3h10z" fill="#dcdce0" />
      </svg>
      <div className="absolute inset-x-[16%] top-[24%] bottom-[24%] grid place-items-center">{children}</div>
      {label && (
        <span className="absolute inset-x-0 bottom-[7%] text-center font-bold text-[17cqw] text-zinc-400 uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

const TEXT_LINES = [92, 100, 84, 96, 70, 88];

function TextLines() {
  return (
    <div className="flex size-full flex-col justify-start gap-[9%]">
      {TEXT_LINES.map((width) => (
        <span key={width} className="h-[5%] min-h-px rounded-full bg-zinc-300" style={{ width: `${width}%` }} />
      ))}
    </div>
  );
}

export function NodeGlyph({ node }: { node: FsNode }) {
  if (node.id === TRASH) return <Trash2 className="size-full p-[10%] text-muted" strokeWidth={1.25} />;
  if (node.kind === "dir")
    return (
      <FolderIcon glyph={FOLDER_GLYPHS[node.id] ?? (node.parentId === HOME ? FOLDER_GLYPHS[node.name] : undefined)} />
    );
  if (node.mime === "application/x-app") return <AppIcon app={getApp(node.content)} />;
  if (node.mime.startsWith("image/"))
    return (
      <div className="grid size-full place-items-center">
        <img
          src={fileUrl(node)}
          alt=""
          draggable={false}
          className="max-h-full max-w-full border-2 border-white object-contain shadow-[0_1px_3px_rgb(0_0_0/0.35)]"
        />
      </div>
    );
  const extension = node.name.includes(".") ? (node.name.split(".").pop() ?? "") : "";
  if (node.mime.startsWith("audio/"))
    return (
      <PaperIcon label={extension}>
        <Music className="size-full text-pink-500" strokeWidth={2} />
      </PaperIcon>
    );
  return (
    <PaperIcon label={extension}>
      <TextLines />
    </PaperIcon>
  );
}

/** Inline name editor: Enter or blur commits, Escape cancels (null). The extension starts unselected. */
export function RenameField({
  name,
  onDone,
  className = "",
}: {
  name: string;
  onDone: (name: string | null) => void;
  className?: string;
}) {
  const dot = name.lastIndexOf(".");
  return (
    <input
      // biome-ignore lint/a11y/noAutofocus: rename starts from an explicit user action
      autoFocus
      aria-label="Name"
      defaultValue={name}
      className={`field h-auto px-1 py-px ${className}`}
      onFocus={(e) => e.target.setSelectionRange(0, dot > 0 ? dot : name.length)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onDone(e.currentTarget.value.trim());
        if (e.key === "Escape") onDone(null);
        e.stopPropagation();
      }}
      onBlur={(e) => onDone(e.currentTarget.value.trim())}
    />
  );
}

interface Props {
  node: FsNode;
  selected: boolean;
  renaming: boolean;
  onRenamed: (name: string | null) => void;
  /** Light text with shadow for use on the wallpaper. */
  onDesktop?: boolean;
}

export function FileIcon({ node, selected, renaming, onRenamed, onDesktop = false }: Props) {
  const iconBg = onDesktop ? "bg-black/25" : "bg-selected";
  const labelTone = onDesktop
    ? "font-medium text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.7),0_0_8px_rgb(0_0_0/0.45)]"
    : "";
  return (
    <div className="flex w-[92px] flex-col items-center gap-1">
      <div className={`size-[68px] rounded-[7px] p-1.5 ${selected ? iconBg : ""}`}>
        <NodeGlyph node={node} />
      </div>
      {renaming ? (
        <RenameField name={node.name} onDone={onRenamed} className="w-full text-center text-xs" />
      ) : (
        <span
          className={`line-clamp-2 max-w-full break-words rounded-[4px] px-1 text-center text-xs leading-[1.3] ${
            selected ? "bg-accent text-white [text-shadow:none]" : labelTone
          }`}
        >
          {displayName(node)}
        </span>
      )}
    </div>
  );
}
