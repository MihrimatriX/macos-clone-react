import { useEffect } from "react";
import type { AppProps } from "../os/apps";
import { formatSize, kindLabel, prettyPath, sizeOf, useFs } from "../os/fs";
import { useWindows } from "../os/windows";
import { NodeGlyph } from "../ui/FileIcon";

/** Get Info panel for any file or folder; live, so renames and edits elsewhere show immediately. */
export default function Info({ win }: AppProps) {
  const nodes = useFs((s) => s.nodes);
  const node = win.props.fileId ? nodes[win.props.fileId] : undefined;
  const update = useWindows((s) => s.update);
  const name = node?.name || "Macintosh HD";

  useEffect(() => update(win.id, { title: `${name} Info` }), [update, win.id, name]);

  if (!node) return <p className="p-6 text-center text-muted">This item no longer exists.</p>;
  const rows: [string, string][] = [
    ["Kind", kindLabel(node)],
    ["Size", formatSize(sizeOf(nodes, node.id))],
    ["Where", node.parentId ? prettyPath(nodes, node.parentId) : "—"],
    ["Created", new Date(node.createdAt).toLocaleString()],
    ["Modified", new Date(node.modifiedAt).toLocaleString()],
  ];
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3 border-line border-b pb-4">
        <div className="size-12 shrink-0">
          <NodeGlyph node={node} />
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[15px]">{name}</p>
          <p className="text-muted text-xs">{formatSize(sizeOf(nodes, node.id))}</p>
        </div>
      </div>
      <h2 className="-mb-2 font-semibold text-xs">General:</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-right text-muted">{label}:</dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
