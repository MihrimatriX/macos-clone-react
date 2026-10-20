import { useEffect, useState } from "react";
import type { AppProps } from "../os/apps";
import { DESKTOP, findChild, HOME, prettyPath, useFs } from "../os/fs";
import { useCommand, useWindows } from "../os/windows";
import { Sheet } from "../ui/Sheet";

const SAVE_FOLDERS = ["Desktop", "Documents", "Downloads"];

export default function TextEdit({ win }: AppProps) {
  const node = useFs((s) => (win.props.fileId ? s.nodes[win.props.fileId] : undefined));
  // null = not edited, so external changes (Terminal, another window) show through until the user types.
  const [draft, setDraft] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState<{ closeAfter: boolean } | null>(null);
  const { update, close, open } = useWindows.getState();
  const text = draft ?? node?.content ?? "";
  const dirty = draft !== null && (node ? draft !== node.content : draft !== "");
  const name = node?.name ?? "Untitled";

  useEffect(() => update(win.id, { dirty, title: dirty ? `${name} — Edited` : name }), [update, win.id, dirty, name]);

  /** Returns false when a Save As sheet is needed first. */
  const save = () => {
    if (!node) return false;
    useFs.getState().write(node.id, text);
    setDraft(null);
    return true;
  };

  useCommand(win.id, (command) => {
    if (command === "save" && !save()) setSaveAs({ closeAfter: false });
    if (command === "save-as") setSaveAs({ closeAfter: false });
    if (command === "save-and-close") {
      if (save()) close(win.id);
      else setSaveAs({ closeAfter: true });
    }
    if (command === "open") open("finder", { dirId: findChild(useFs.getState().nodes, HOME, "Documents")?.id ?? HOME });
  });

  return (
    <div className="flex h-full flex-col">
      <textarea
        aria-label="Document"
        spellCheck={false}
        className="flex-1 resize-none bg-surface px-8 py-6 text-[13px] leading-[1.55] outline-none"
        value={text}
        onChange={(e) => setDraft(e.target.value)}
      />
      {saveAs && (
        <SaveAsSheet
          defaultName={node?.name ?? "Untitled.txt"}
          onCancel={() => setSaveAs(null)}
          onSave={(parentId, fileName) => {
            const id = useFs.getState().create(parentId, fileName, "file", text);
            update(win.id, { props: { ...win.props, fileId: id } });
            setDraft(null);
            setSaveAs(null);
            if (saveAs.closeAfter) close(win.id);
          }}
        />
      )}
    </div>
  );
}

interface SheetProps {
  defaultName: string;
  onCancel: () => void;
  onSave: (parentId: string, name: string) => void;
}

function SaveAsSheet({ defaultName, onCancel, onSave }: SheetProps) {
  const nodes = useFs((s) => s.nodes);
  const folders = [HOME, ...SAVE_FOLDERS.map((f) => findChild(nodes, HOME, f)?.id ?? DESKTOP)];
  const [error, setError] = useState("");

  return (
    <Sheet>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          try {
            onSave(String(data.get("folder")), String(data.get("name")).trim());
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label className="flex items-center gap-2">
          <span className="w-16 text-right">Save As:</span>
          <input
            name="name"
            // biome-ignore lint/a11y/noAutofocus: the sheet exists only to collect this name
            autoFocus
            required
            defaultValue={defaultName}
            className="field flex-1"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-16 text-right">Where:</span>
          <select name="folder" defaultValue={folders[2]} className="popup flex-1">
            {folders.map((id) => (
              <option key={id} value={id}>
                {prettyPath(nodes, id)}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={onCancel}>
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
