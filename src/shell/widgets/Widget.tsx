import type { ReactNode } from "react";

/** Glass widget card: a square, or as wide as a notification. */
export function Widget({
  wide = false,
  className = "",
  children,
}: {
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`glass h-[163px] rounded-[24px] p-3 ${wide ? "w-[340px]" : "w-[163px]"} ${className}`}>
      {children}
    </section>
  );
}
