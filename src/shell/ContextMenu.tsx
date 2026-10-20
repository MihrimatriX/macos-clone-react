import { useSystem } from "../os/system";
import { MenuList } from "../ui/Menu";

/** Dock menus sit just past the Dock edge, centred on the icon. */
const BESIDE_DOCK = {
  bottom: "translate(-50%, calc(-100% - 10px))",
  left: "translate(10px, -50%)",
  right: "translate(calc(-100% - 10px), -50%)",
};

/** The single right-click menu; anything can open it via useSystem().openContextMenu. */
export function ContextMenu() {
  const menu = useSystem((s) => s.contextMenu);
  const close = useSystem((s) => s.closeContextMenu);
  if (!menu) return null;
  const rows = menu.items.length;
  return (
    <>
      <div
        className="fixed inset-0 z-[3000]"
        onMouseDown={close}
        onContextMenu={(e) => {
          e.preventDefault();
          close();
        }}
      />
      <MenuList
        items={menu.items}
        onClose={close}
        className="fixed z-[3001]"
        style={
          menu.dock
            ? { left: menu.x, top: menu.y, transform: BESIDE_DOCK[menu.dock] }
            : {
                left: Math.min(menu.x, window.innerWidth - 230),
                top: Math.min(menu.y, window.innerHeight - rows * 24 - 16),
              }
        }
      />
    </>
  );
}
