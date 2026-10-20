import { useEffect, useState } from "react";
import { Logo } from "../ui/AppIcons";

const megabytes = (bytes = 0) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export default function About() {
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  useEffect(() => {
    navigator.storage?.estimate().then(setStorage);
  }, []);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  const rows: [string, string][] = [
    ["Processor", `${navigator.hardwareConcurrency} cores`],
    ["Memory", memory ? `${memory} GB` : "Unknown"],
    ["Display", `${screen.width} × ${screen.height} @${window.devicePixelRatio}x`],
    ["Storage", storage ? `${megabytes(storage.usage)} of ${megabytes(storage.quota)}` : "…"],
  ];

  return (
    <div className="titlebar flex h-full flex-col items-center gap-4 px-7 pt-12 text-center">
      <span className="grid size-24 place-items-center rounded-[22%] bg-gradient-to-b from-sky-400 to-indigo-600 shadow-[0_6px_18px_rgb(0_0_0/0.25)]">
        <span className="text-white">
          <Logo size={56} />
        </span>
      </span>
      <div>
        <h1 className="font-bold text-[22px]">macOS Web</h1>
        <p className="text-muted text-xs">Version 1.0 · Running in your browser</p>
      </div>
      <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-left text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-right text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
