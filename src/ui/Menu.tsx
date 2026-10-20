import { Check, ChevronRight } from "lucide-react";
import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from "react";

export interface MenuAction {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  /** Turns the row into a submenu that opens to its right. */
  items?: MenuItem[];
  onSelect?: () => void;
}
export type MenuItem = MenuAction | "sep";

interface Props {
  items: MenuItem[];
  onClose: () => void;
  /** ArrowLeft inside a submenu hands focus back to its parent. */
  onBack?: () => void;
  autoFocus?: boolean;
  style?: CSSProperties;
  className?: string;
}

/** Keyboard-navigable dropdown shared by the menu bar, context menus and the Dock. */
export function MenuList({ items, onClose, onBack, autoFocus = true, style, className = "" }: Props) {
  const [active, setActive] = useState(-1);
  // A submenu opened from the keyboard takes focus; one opened by hovering leaves it with the parent.
  const [subFocused, setSubFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const highlight = (i: number) => {
    setActive(i);
    setSubFocused(false);
  };

  const step = (direction: 1 | -1) => {
    let i = active;
    for (let tries = 0; tries < items.length; tries++) {
      i = (i + direction + items.length) % items.length;
      const item = items[i];
      if (item && item !== "sep" && !item.disabled) return highlight(i);
    }
  };

  const select = (item: MenuAction) => {
    if (item.disabled || item.items) return;
    onClose();
    item.onSelect?.();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const item = items[active];
    if (e.key === "ArrowDown") step(1);
    else if (e.key === "ArrowUp") step(-1);
    else if (e.key === "ArrowRight" && item && item !== "sep" && item.items) setSubFocused(true);
    else if (e.key === "ArrowLeft" && onBack) onBack();
    else if (e.key === "Enter" && item && item !== "sep") select(item);
    else if (e.key === "Escape") onClose();
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      className={`menu-panel ${className}`}
      style={style}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item === "sep" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: separators have no identity
          <hr key={`sep${i}`} className="mx-2 my-1 border-line" />
        ) : (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: labels can repeat (Dock menus list window titles)
            key={`${i}:${item.label}`}
            role="menuitem"
            tabIndex={-1}
            aria-disabled={item.disabled}
            aria-haspopup={item.items ? "menu" : undefined}
            data-active={active === i}
            className="menu-item relative"
            onMouseEnter={() => highlight(i)}
            onMouseLeave={() => setActive(-1)}
            onClick={() => select(item)}
          >
            <span className="w-3">{item.checked && <Check size={12} />}</span>
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
            {item.shortcut && <span className="opacity-60 tracking-widest">{item.shortcut}</span>}
            {item.items && <ChevronRight size={13} className="opacity-60" />}
            {item.items && active === i && (
              <MenuList
                // Remounting moves focus into the submenu when it is entered from the keyboard.
                key={String(subFocused)}
                items={item.items}
                onClose={onClose}
                onBack={() => {
                  setSubFocused(false);
                  ref.current?.focus();
                }}
                autoFocus={subFocused}
                className="absolute top-[-6px] left-full"
              />
            )}
          </div>
        ),
      )}
    </div>
  );
}
