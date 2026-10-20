import { create } from "zustand";
import { persist } from "zustand/middleware";

export const START = "about:start";

interface Bookmark {
  title: string;
  url: string;
}

export const useBookmarks = create<{ bookmarks: Bookmark[] }>()(
  persist(
    () => ({
      bookmarks: [
        { title: "Wikipedia", url: "https://en.wikipedia.org" },
        { title: "Example", url: "https://example.com" },
        { title: "OpenStreetMap", url: "https://www.openstreetmap.org/export/embed.html?bbox=28.95,41.0,29.05,41.06" },
      ],
    }),
    { name: "safari-bookmarks" },
  ),
);

/** Address bar input → URL. Plain words search Wikipedia, which (unlike most search engines) allows framing. */
export function toUrl(input: string) {
  const text = input.trim();
  if (/^https?:\/\//i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) return `https://${text}`;
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(text)}`;
}

export function hostOf(url: string) {
  if (url === START) return "Start Page";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Stable tile colour per site, since favicons cannot be fetched cross-origin without a proxy. */
const tileColor = (text: string) => `hsl(${[...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360} 62% 52%)`;

/** Favorites grid shown for new tabs. */
export function StartPage({ onOpen }: { onOpen: (url: string) => void }) {
  const bookmarks = useBookmarks((s) => s.bookmarks);
  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto bg-gradient-to-b from-hover to-surface pt-20">
      <div className="w-full max-w-2xl px-8">
        <h2 className="mb-5 font-bold text-xl">Favorites</h2>
        <div className="grid grid-cols-[repeat(auto-fill,88px)] gap-x-4 gap-y-6">
          {bookmarks.map((b) => (
            <button
              key={b.url}
              type="button"
              className="flex flex-col items-center gap-2"
              onClick={() => onOpen(b.url)}
            >
              <span
                className="grid size-16 place-items-center rounded-[14px] font-bold text-2xl text-white shadow-[0_2px_8px_rgb(0_0_0/0.15)]"
                style={{ background: tileColor(b.title) }}
              >
                {b.title[0]?.toUpperCase()}
              </span>
              <span className="w-full truncate text-center text-xs">{b.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
