import type { ReactNode } from "react";

/** Inset grouped list section, as in System Settings. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      {title && <h3 className="px-1 font-semibold">{title}</h3>}
      <div className="group-box">{children}</div>
    </section>
  );
}

export function Row({ label, detail, children }: { label: string; detail?: string; children: ReactNode }) {
  return (
    <div className="group-row">
      <div className="min-w-0">
        <p>{label}</p>
        {detail && <p className="text-muted text-xs">{detail}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
