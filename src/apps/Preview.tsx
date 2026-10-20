import { ChevronLeft, ChevronRight, Play, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { AppProps } from "../os/apps";
import { children, fileUrl, findChild, HOME, useFs } from "../os/fs";
import { useCommand, useWindows } from "../os/windows";

const SLIDE_MS = 3000;

function ToolButton({ label, onClick, children: icon }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} className="tool" onClick={onClick}>
      {icon}
    </button>
  );
}

export default function Preview({ win }: AppProps) {
  const nodes = useFs((s) => s.nodes);
  const file = win.props.fileId ? nodes[win.props.fileId] : undefined;
  const folder = file?.parentId ?? findChild(nodes, HOME, "Pictures")?.id ?? HOME;
  const images = children(nodes, folder).filter((n) => n.mime.startsWith("image/"));
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      images.findIndex((n) => n.id === file?.id),
    ),
  );
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [slideshow, setSlideshow] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const image = images[index] ?? images[0];
  const update = useWindows((s) => s.update);

  useEffect(() => update(win.id, { title: image?.name ?? "Preview" }), [update, win.id, image?.name]);

  const go = (delta: number) => {
    setIndex((i) => (i + delta + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  };
  const zoomBy = (factor: number) => setZoom((z) => Math.min(8, Math.max(0.1, z * factor)));

  const count = images.length;
  useEffect(() => {
    if (!slideshow) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    const onExit = () => !document.fullscreenElement && setSlideshow(false);
    document.addEventListener("fullscreenchange", onExit);
    return () => {
      clearInterval(timer);
      document.removeEventListener("fullscreenchange", onExit);
    };
  }, [slideshow, count]);

  const startSlideshow = () => {
    setSlideshow(true);
    stage.current?.requestFullscreen().catch(() => setSlideshow(false));
  };

  const commands: Record<string, () => void> = {
    "zoom-in": () => zoomBy(1.25),
    "zoom-out": () => zoomBy(0.8),
    "actual-size": () => setZoom(1),
    "rotate-left": () => setRotation((r) => r - 90),
    "rotate-right": () => setRotation((r) => r + 90),
    slideshow: startSlideshow,
    previous: () => go(-1),
    next: () => go(1),
  };
  useCommand(win.id, (command) => commands[command]?.());

  if (!image)
    return (
      <div className="flex h-full flex-col bg-surface">
        <div className="titlebar toolbar" />
        <p className="grid flex-1 place-items-center text-muted">No images in this folder.</p>
      </div>
    );

  return (
    <div className="flex h-full">
      <aside className="titlebar flex w-28 shrink-0 flex-col items-center gap-3 overflow-y-auto px-3 pt-[52px] pb-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            aria-label={img.name}
            className="flex flex-col items-center gap-1"
            onClick={() => go(i - index)}
          >
            <span className={`rounded-[5px] p-1 ${i === index ? "bg-selected" : ""}`}>
              <img
                src={fileUrl(img)}
                alt=""
                className="max-h-16 w-full object-contain shadow-[0_1px_3px_rgb(0_0_0/0.3)]"
              />
            </span>
            <span className="text-[10px] text-muted tabular-nums">{i + 1}</span>
          </button>
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-surface shadow-[-0.5px_0_0_var(--line)]">
        <div className="titlebar toolbar">
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold text-[13px]">{image.name}</h1>
            <p className="text-[11px] text-muted tabular-nums">
              {index + 1} of {images.length} · {Math.round(zoom * 100)}%
            </p>
          </div>
          <ToolButton label="Zoom Out" onClick={() => zoomBy(0.8)}>
            <ZoomOut />
          </ToolButton>
          <ToolButton label="Zoom In" onClick={() => zoomBy(1.25)}>
            <ZoomIn />
          </ToolButton>
          <ToolButton label="Rotate Left" onClick={() => setRotation((r) => r - 90)}>
            <RotateCcw />
          </ToolButton>
          <ToolButton label="Rotate Right" onClick={() => setRotation((r) => r + 90)}>
            <RotateCw />
          </ToolButton>
          <ToolButton label="Slideshow" onClick={startSlideshow}>
            <Play />
          </ToolButton>
        </div>
        <div
          ref={stage}
          role="img"
          aria-label={image.name}
          tabIndex={-1}
          className="group relative grid min-h-0 flex-1 place-items-center overflow-auto bg-[#e8e8ea] p-6 outline-none dark:bg-[#1a1a1a] [&:fullscreen]:bg-black"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") go(-1);
            if (e.key === "ArrowRight") go(1);
          }}
        >
          <img
            src={fileUrl(image)}
            alt={image.name}
            draggable={false}
            className="max-h-full max-w-full shadow-[0_4px_20px_rgb(0_0_0/0.25)] transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
          />
          <div className="absolute bottom-4 flex gap-1 rounded-full bg-black/45 p-1 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100 [&_button]:rounded-full [&_button]:p-1.5 [&_button:hover]:bg-white/20">
            <button type="button" aria-label="Previous image" onClick={() => go(-1)}>
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label="Next image" onClick={() => go(1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
