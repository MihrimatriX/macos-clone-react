import type { DragEvent, MouseEvent, ReactNode } from "react";
import { allowDrop } from "./dnd";

export interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Trailing detail such as a count. */
  badge?: ReactNode;
}

interface Props {
  sections: { title?: string; items: SidebarItem[] }[];
  active: string | null;
  onSelect: (id: string) => void;
  onDrop?: (id: string, e: DragEvent) => void;
  onContextMenu?: (id: string, e: MouseEvent) => void;
  header?: ReactNode;
  footer?: ReactNode;
}

/**
 * Source list for Finder, Settings and Notes. In Tahoe it floats as a glass panel inset from the window
 * edge, with the traffic lights sitting inside its top corner (see .sidebar in index.css).
 */
export function Sidebar({ sections, active, onSelect, onDrop, onContextMenu, header, footer }: Props) {
  return (
    <nav className="titlebar sidebar m-2 flex w-[208px] shrink-0 flex-col rounded-[18px]">
      {/* Scrolling lives inside: overflow on the glass itself would clip its corner fillers. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-2 pt-[42px] pb-2">
        {header}
        {sections.map((section) => (
          <div key={section.title ?? "main"} className="flex flex-col gap-px">
            {section.title && <h3 className="px-2 pb-0.5 font-semibold text-[11px] text-muted">{section.title}</h3>}
            {section.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`flex h-7 w-full items-center gap-2 rounded-[9px] px-2 text-left [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-accent ${
                  active === item.id ? "bg-selected" : ""
                }`}
                onClick={() => onSelect(item.id)}
                onDragOver={onDrop && allowDrop}
                onDrop={onDrop && ((e) => onDrop(item.id, e))}
                onContextMenu={onContextMenu && ((e) => onContextMenu(item.id, e))}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && <span className="text-muted text-xs">{item.badge}</span>}
              </button>
            ))}
          </div>
        ))}
        {footer && <div className="mt-auto">{footer}</div>}
      </div>
    </nav>
  );
}
