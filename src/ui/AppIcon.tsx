import type { AppDef } from "../os/apps";

/** Squircle app icon; fills its container so the Dock can scale it freely. */
export function AppIcon({ app }: { app: AppDef }) {
  return (
    <div className="app-icon">
      <app.icon />
    </div>
  );
}
