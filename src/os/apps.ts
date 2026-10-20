import { type ComponentType, type LazyExoticComponent, lazy } from "react";
import {
  AboutIcon,
  CalculatorIcon,
  CalendarIcon,
  FinderIcon,
  InfoIcon,
  MusicIcon,
  NotesIcon,
  PreviewIcon,
  SafariIcon,
  SettingsIcon,
  TerminalIcon,
  TextEditIcon,
} from "../ui/AppIcons";
import type { Win } from "./windows";

export interface MenuCommand {
  label: string;
  /** Window-manager command (see runCommand) or an app command delivered via useCommand. */
  command: string;
  /** Display form like "⇧⌘N"; hotkeys.ts parses the same string, so menus and shortcuts never drift apart. */
  shortcut?: string;
}
export type MenuEntry = MenuCommand | "sep";
export interface MenuDef {
  title: string;
  items: MenuEntry[];
}

export interface Size {
  w: number;
  h: number;
}

export interface AppProps {
  win: Win;
}

export interface AppDef {
  id: string;
  name: string;
  icon: ComponentType;
  component: LazyExoticComponent<ComponentType<AppProps>>;
  defaultSize: Size;
  minSize: Size;
  singleInstance: boolean;
  menus: MenuDef[];
  /** Mime types (or "type/" prefixes) this app opens. */
  fileTypes: string[];
  /** Utility windows that are not listed in the Dock, Launchpad or Applications. */
  hidden?: boolean;
  /** The app draws its own 52px toolbar (class "titlebar toolbar") under the traffic lights instead of a title bar. */
  unified?: boolean;
}

export const APPS: AppDef[] = [
  {
    id: "finder",
    name: "Finder",
    unified: true,
    icon: FinderIcon,
    component: lazy(() => import("../apps/finder/Finder")),
    defaultSize: { w: 820, h: 500 },
    minSize: { w: 520, h: 300 },
    singleInstance: false,
    menus: [
      {
        title: "File",
        items: [
          { label: "New Finder Window", command: "new-window", shortcut: "⌘N" },
          { label: "New Folder", command: "new-folder", shortcut: "⇧⌘N" },
          { label: "Open", command: "open", shortcut: "⌘O" },
          "sep",
          { label: "Get Info", command: "get-info", shortcut: "⌘I" },
          { label: "Rename", command: "rename" },
          { label: "Duplicate", command: "duplicate", shortcut: "⌘D" },
          "sep",
          { label: "Move to Trash", command: "trash", shortcut: "⌘⌫" },
          { label: "Empty Trash", command: "empty-trash", shortcut: "⇧⌘⌫" },
        ],
      },
      {
        title: "View",
        items: [
          { label: "as Icons", command: "view-icons", shortcut: "⌘1" },
          { label: "as List", command: "view-list", shortcut: "⌘2" },
          "sep",
          { label: "Sort by Name", command: "sort-name" },
          { label: "Sort by Kind", command: "sort-kind" },
          { label: "Sort by Date Modified", command: "sort-date" },
          { label: "Sort by Size", command: "sort-size" },
        ],
      },
      {
        title: "Go",
        items: [
          { label: "Back", command: "back", shortcut: "⌘[" },
          { label: "Forward", command: "forward", shortcut: "⌘]" },
          { label: "Enclosing Folder", command: "up", shortcut: "⌘↑" },
          "sep",
          { label: "Applications", command: "go:Applications", shortcut: "⇧⌘A" },
          { label: "Desktop", command: "go:Desktop", shortcut: "⇧⌘D" },
          { label: "Documents", command: "go:Documents", shortcut: "⇧⌘O" },
          { label: "Downloads", command: "go:Downloads", shortcut: "⇧⌘L" },
          { label: "Home", command: "go:Home", shortcut: "⇧⌘H" },
          { label: "Trash", command: "go:Trash" },
        ],
      },
    ],
    fileTypes: ["inode/directory"],
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: TerminalIcon,
    component: lazy(() => import("../apps/terminal/Terminal")),
    defaultSize: { w: 640, h: 400 },
    minSize: { w: 360, h: 200 },
    singleInstance: false,
    menus: [
      {
        title: "Shell",
        items: [
          { label: "New Window", command: "new-window", shortcut: "⌘N" },
          { label: "Clear", command: "clear", shortcut: "⌘K" },
        ],
      },
    ],
    fileTypes: [],
  },
  {
    id: "textedit",
    name: "TextEdit",
    icon: TextEditIcon,
    component: lazy(() => import("../apps/TextEdit")),
    defaultSize: { w: 600, h: 460 },
    minSize: { w: 320, h: 220 },
    singleInstance: false,
    menus: [
      {
        title: "File",
        items: [
          { label: "New", command: "new-window", shortcut: "⌘N" },
          { label: "Open…", command: "open", shortcut: "⌘O" },
          "sep",
          { label: "Save", command: "save", shortcut: "⌘S" },
          { label: "Save As…", command: "save-as", shortcut: "⇧⌘S" },
        ],
      },
    ],
    fileTypes: ["text/", "application/json"],
  },
  {
    id: "safari",
    name: "Safari",
    unified: true,
    icon: SafariIcon,
    component: lazy(() => import("../apps/safari/Safari")),
    defaultSize: { w: 960, h: 620 },
    minSize: { w: 480, h: 320 },
    singleInstance: false,
    menus: [
      {
        title: "File",
        items: [
          { label: "New Window", command: "new-window", shortcut: "⌘N" },
          { label: "New Tab", command: "new-tab", shortcut: "⌘T" },
          { label: "Close Tab", command: "close-tab" },
        ],
      },
      {
        title: "View",
        items: [
          { label: "Reload Page", command: "reload" },
          { label: "Back", command: "back", shortcut: "⌘[" },
          { label: "Forward", command: "forward", shortcut: "⌘]" },
        ],
      },
      { title: "Bookmarks", items: [{ label: "Add Bookmark", command: "bookmark", shortcut: "⌘D" }] },
    ],
    fileTypes: [],
  },
  {
    id: "notes",
    name: "Notes",
    unified: true,
    icon: NotesIcon,
    component: lazy(() => import("../apps/notes/Notes")),
    defaultSize: { w: 860, h: 520 },
    minSize: { w: 640, h: 320 },
    singleInstance: true,
    menus: [
      {
        title: "File",
        items: [
          { label: "New Note", command: "new-note", shortcut: "⌘N" },
          { label: "New Folder", command: "new-folder", shortcut: "⇧⌘N" },
          "sep",
          { label: "Pin Note", command: "pin" },
          { label: "Delete Note", command: "delete" },
        ],
      },
    ],
    fileTypes: [],
  },
  {
    id: "preview",
    name: "Preview",
    unified: true,
    icon: PreviewIcon,
    component: lazy(() => import("../apps/Preview")),
    defaultSize: { w: 720, h: 560 },
    minSize: { w: 360, h: 300 },
    singleInstance: false,
    menus: [
      {
        title: "View",
        items: [
          { label: "Zoom In", command: "zoom-in", shortcut: "⌘=" },
          { label: "Zoom Out", command: "zoom-out", shortcut: "⌘-" },
          { label: "Actual Size", command: "actual-size", shortcut: "⌘0" },
          "sep",
          { label: "Rotate Left", command: "rotate-left", shortcut: "⌘L" },
          { label: "Rotate Right", command: "rotate-right", shortcut: "⌘R" },
          "sep",
          { label: "Slideshow", command: "slideshow", shortcut: "⇧⌘F" },
        ],
      },
      {
        title: "Go",
        items: [
          { label: "Previous", command: "previous", shortcut: "⌘←" },
          { label: "Next", command: "next", shortcut: "⌘→" },
        ],
      },
    ],
    fileTypes: ["image/"],
  },
  {
    id: "music",
    name: "Music",
    unified: true,
    icon: MusicIcon,
    component: lazy(() => import("../apps/Music")),
    defaultSize: { w: 680, h: 480 },
    minSize: { w: 480, h: 300 },
    singleInstance: true,
    menus: [
      { title: "File", items: [{ label: "Import…", command: "import", shortcut: "⇧⌘O" }] },
      {
        title: "Controls",
        items: [
          { label: "Play / Pause", command: "toggle", shortcut: "Space" },
          { label: "Next", command: "next", shortcut: "⌘→" },
          { label: "Previous", command: "previous", shortcut: "⌘←" },
          "sep",
          { label: "Increase Volume", command: "louder", shortcut: "⌘↑" },
          { label: "Decrease Volume", command: "quieter", shortcut: "⌘↓" },
        ],
      },
    ],
    fileTypes: ["audio/"],
  },
  {
    id: "calendar",
    name: "Calendar",
    unified: true,
    icon: CalendarIcon,
    component: lazy(() => import("../apps/calendar/Calendar")),
    defaultSize: { w: 860, h: 600 },
    minSize: { w: 560, h: 420 },
    singleInstance: true,
    menus: [
      { title: "File", items: [{ label: "New Event", command: "new-event", shortcut: "⌘N" }] },
      {
        title: "View",
        items: [
          { label: "Month", command: "view-month", shortcut: "⌘1" },
          { label: "Week", command: "view-week", shortcut: "⌘2" },
          "sep",
          { label: "Go to Today", command: "today" },
        ],
      },
    ],
    fileTypes: [],
  },
  {
    id: "calculator",
    name: "Calculator",
    unified: true,
    icon: CalculatorIcon,
    component: lazy(() => import("../apps/calculator/Calculator")),
    defaultSize: { w: 250, h: 390 },
    minSize: { w: 230, h: 360 },
    singleInstance: true,
    menus: [
      {
        title: "View",
        items: [
          { label: "Basic", command: "basic", shortcut: "⌘1" },
          { label: "Scientific", command: "scientific", shortcut: "⌘2" },
        ],
      },
    ],
    fileTypes: [],
  },
  {
    id: "settings",
    name: "System Settings",
    unified: true,
    icon: SettingsIcon,
    component: lazy(() => import("../apps/settings/Settings")),
    defaultSize: { w: 720, h: 520 },
    minSize: { w: 560, h: 400 },
    singleInstance: true,
    menus: [],
    fileTypes: [],
  },
  {
    id: "info",
    name: "Info",
    icon: InfoIcon,
    component: lazy(() => import("../apps/Info")),
    defaultSize: { w: 280, h: 380 },
    minSize: { w: 260, h: 300 },
    singleInstance: false,
    menus: [],
    fileTypes: [],
    hidden: true,
  },
  {
    id: "about",
    name: "About This Mac",
    unified: true,
    icon: AboutIcon,
    component: lazy(() => import("../apps/About")),
    defaultSize: { w: 290, h: 380 },
    minSize: { w: 290, h: 380 },
    singleInstance: true,
    menus: [],
    fileTypes: [],
    hidden: true,
  },
];

export function getApp(id: string): AppDef {
  const app = APPS.find((a) => a.id === id);
  if (!app) throw new Error(`Unknown app: ${id}`);
  return app;
}

export const visibleApps = () => APPS.filter((a) => !a.hidden);

export const appForMime = (mime: string) =>
  APPS.find((a) => a.fileTypes.some((type) => (type.endsWith("/") ? mime.startsWith(type) : mime === type)));

/** Full menu bar for an app: app menu, the app's own menus, then the shared Window menu. */
export function menusFor(app: AppDef): MenuDef[] {
  return [
    {
      title: app.name,
      items: [
        { label: "About This Mac", command: "about" },
        "sep",
        { label: "System Settings…", command: "settings", shortcut: "⌘," },
        "sep",
        { label: `Quit ${app.name}`, command: "quit", shortcut: "⌘Q" },
      ],
    },
    ...app.menus,
    {
      title: "Window",
      items: [
        { label: "Minimize", command: "minimize", shortcut: "⌘M" },
        { label: "Zoom", command: "zoom" },
        { label: "Cycle Through Windows", command: "cycle", shortcut: "⌘`" },
        "sep",
        { label: "Close Window", command: "close", shortcut: "⌘W" },
      ],
    },
  ];
}
