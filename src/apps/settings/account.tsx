import { useState } from "react";
import { factoryReset } from "../../os/idb";
import { useSettings } from "../../os/settings";
import { Avatar } from "../../ui/Avatar";
import { Sheet } from "../../ui/Sheet";
import { Group, Row } from "./Group";

/** Avatars are downscaled so a large photo cannot overflow the localStorage quota. */
function toAvatar(file: File, done: (url: string) => void) {
  const img = new window.Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 160;
    const side = Math.min(img.width, img.height);
    canvas
      .getContext("2d")
      ?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 160, 160);
    done(canvas.toDataURL("image/jpeg", 0.85));
    URL.revokeObjectURL(img.src);
  };
  img.src = URL.createObjectURL(file);
}

export function UsersPane() {
  const userName = useSettings((s) => s.userName);
  const avatar = useSettings((s) => s.avatar);
  const set = useSettings((s) => s.set);
  return (
    <Group>
      <div className="flex items-center gap-4 p-4">
        <Avatar size={64} />
        <div className="flex-1">
          <p className="font-semibold text-base">{userName}</p>
          <p className="text-muted text-xs">Admin</p>
        </div>
        <label className="btn">
          Choose Picture…
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && toAvatar(e.target.files[0], (url) => set({ avatar: url }))}
          />
        </label>
        {avatar && (
          <button type="button" className="btn" onClick={() => set({ avatar: "" })}>
            Remove
          </button>
        )}
      </div>
      <Row label="Full name">
        <input
          aria-label="Full name"
          className="field w-56 text-right"
          value={userName}
          onChange={(e) => set({ userName: e.target.value })}
        />
      </Row>
    </Group>
  );
}

export function ResetPane() {
  const [confirming, setConfirming] = useState(false);
  return (
    <Group>
      <Row
        label="Erase All Content and Settings"
        detail="Removes files, notes, events and settings, then restarts fresh."
      >
        <button type="button" className="btn" onClick={() => setConfirming(true)}>
          Erase…
        </button>
      </Row>
      {confirming && (
        <Sheet>
          <p className="mb-1 font-semibold">Erase all content and settings?</p>
          <p className="mb-4 text-muted text-xs">This cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setConfirming(false)}>
              Cancel
            </button>
            <button type="button" className="btn-primary btn-danger" onClick={factoryReset}>
              Erase
            </button>
          </div>
        </Sheet>
      )}
    </Group>
  );
}
