import { ChevronLeft, ChevronRight, ExternalLink, Plus, RotateCw, Search, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useCommand, useWindows } from "../../os/windows";
import { hostOf, START, StartPage, toUrl, useBookmarks } from "./web";

interface Tab {
  id: string;
  history: string[];
  index: number;
  /** Bumped to remount the iframe on reload. */
  reload: number;
}

const newTab = (): Tab => ({ id: crypto.randomUUID(), history: [START], index: 0, reload: 0 });

export default function Safari({ win }: AppProps) {
  const [tabs, setTabs] = useState<Tab[]>(() => [newTab()]);
  const [activeId, setActiveId] = useState(() => tabs[0]?.id ?? "");
  const bookmarks = useBookmarks((s) => s.bookmarks);
  const tab = tabs.find((t) => t.id === activeId) ?? tabs[0] ?? newTab();
  const url = tab.history[tab.index] ?? START;
  const update = useWindows((s) => s.update);

  useEffect(() => update(win.id, { title: hostOf(url) }), [update, win.id, url]);

  const patch = (change: (t: Tab) => Partial<Tab>) =>
    setTabs((all) => all.map((t) => (t.id === tab.id ? { ...t, ...change(t) } : t)));
  const navigate = (to: string) =>
    patch((t) => ({ history: [...t.history.slice(0, t.index + 1), to], index: t.index + 1 }));
  const step = (delta: number) =>
    patch((t) => ({ index: Math.min(t.history.length - 1, Math.max(0, t.index + delta)) }));
  const openTab = () => {
    const created = newTab();
    setTabs((all) => [...all, created]);
    setActiveId(created.id);
  };
  const closeTab = (id: string) => {
    const rest = tabs.filter((t) => t.id !== id);
    if (rest.length === 0) return useWindows.getState().close(win.id);
    setTabs(rest);
    if (id === tab.id) setActiveId(rest[rest.length - 1]?.id ?? "");
  };
  const bookmark = () => {
    if (url === START || bookmarks.some((b) => b.url === url)) return;
    useBookmarks.setState({ bookmarks: [...bookmarks, { title: hostOf(url), url }] });
  };

  useCommand(win.id, (command) => {
    if (command === "new-tab") openTab();
    if (command === "close-tab") closeTab(tab.id);
    if (command === "reload") patch((t) => ({ reload: t.reload + 1 }));
    if (command === "bookmark") bookmark();
    if (command === "back") step(-1);
    if (command === "forward") step(1);
  });

  const saved = bookmarks.some((b) => b.url === url);
  return (
    <div className="flex h-full flex-col bg-surface">
      <form
        className="titlebar toolbar gap-1 pl-[84px]"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("address"));
          if (value.trim()) navigate(toUrl(value));
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <button type="button" aria-label="Back" className="tool" disabled={tab.index === 0} onClick={() => step(-1)}>
          <ChevronLeft />
        </button>
        <button
          type="button"
          aria-label="Forward"
          className="tool"
          disabled={tab.index === tab.history.length - 1}
          onClick={() => step(1)}
        >
          <ChevronRight />
        </button>
        <div className="relative mx-auto flex w-full max-w-xl items-center">
          <Search size={13} className="pointer-events-none absolute left-2.5 text-muted" />
          <input
            key={`${tab.id}-${tab.index}`}
            name="address"
            aria-label="Address"
            placeholder="Search or enter website name"
            defaultValue={url === START ? "" : url}
            className="peer h-7 w-full rounded-[8px] bg-hover px-8 text-center outline-none placeholder:text-muted focus:bg-surface focus:text-left focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            aria-label="Reload"
            className="absolute right-1 grid size-6 place-items-center rounded text-muted hover:text-fg"
            onClick={() => patch((t) => ({ reload: t.reload + 1 }))}
          >
            <RotateCw size={13} />
          </button>
        </div>
        <button type="button" aria-label="Add bookmark" className="tool" disabled={url === START} onClick={bookmark}>
          <Star className={saved ? "fill-current text-amber-400" : ""} />
        </button>
        <button type="button" aria-label="New tab" className="tool" onClick={openTab}>
          <Plus />
        </button>
      </form>
      {tabs.length > 1 && (
        <div className="flex h-7 shrink-0 gap-px border-line border-y bg-black/[0.04] p-0.5 dark:bg-black/20">
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`group relative flex min-w-0 flex-1 items-center justify-center rounded-[5px] px-6 text-xs ${
                t.id === tab.id ? "bg-surface shadow-[var(--control-shadow)]" : "text-muted hover:bg-hover"
              }`}
            >
              <button
                type="button"
                aria-label="Close tab"
                className="absolute left-1.5 hidden rounded p-0.5 hover:bg-hover group-hover:block"
                onClick={() => closeTab(t.id)}
              >
                <X size={11} />
              </button>
              <button type="button" className="min-w-0 truncate" onClick={() => setActiveId(t.id)}>
                {hostOf(t.history[t.index] ?? START)}
              </button>
            </div>
          ))}
        </div>
      )}
      <nav aria-label="Bookmarks" className="flex h-6 shrink-0 items-center gap-4 border-line border-b px-4 text-xs">
        {bookmarks.map((b) => (
          <button
            key={b.url}
            type="button"
            className="truncate text-muted hover:text-fg"
            onClick={() => navigate(b.url)}
          >
            {b.title}
          </button>
        ))}
      </nav>
      {url === START ? (
        <StartPage onOpen={navigate} />
      ) : (
        <>
          <p className="flex shrink-0 items-center justify-center gap-2 bg-hover py-1 text-[11px] text-muted">
            Many sites refuse to load inside other pages.
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-medium text-accent hover:underline"
            >
              Open in New Tab <ExternalLink size={11} />
            </a>
          </p>
          <iframe
            key={`${tab.id}-${tab.index}-${tab.reload}`}
            title={hostOf(url)}
            src={url}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="min-h-0 flex-1 bg-white"
          />
        </>
      )}
    </div>
  );
}
