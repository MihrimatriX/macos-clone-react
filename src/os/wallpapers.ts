/*
 * Wallpapers are CSS background values. The first two are SVG paintings generated here (no image
 * files, no Apple artwork); the rest are mesh gradients. Each has a light and a dark variant.
 */

type Point = [number, number];
const W = 1600;
const H = 1000;

const svgUrl = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' preserveAspectRatio='xMidYMid slice'>${body}</svg>`,
  )}") center / cover`;

const vertical = (id: string, stops: [number, string][]) =>
  `<linearGradient id='${id}' x2='0' y2='1'>${stops.map(([o, c]) => `<stop offset='${o}' stop-color='${c}'/>`).join("")}</linearGradient>`;

/** Catmull-Rom spline through the points, as cubic Bézier commands. */
function smooth(points: Point[]) {
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))] as Point;
  let d = `M${at(0).join(" ")}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1.join(" ")} ${c2.join(" ")} ${p2.join(" ")}`;
  }
  return d;
}

/** Deterministic random numbers, so a wallpaper renders identically on every load. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** Rolling glassy hills, after the Tahoe default. Each band is [baseline, amplitude, frequency, phase, tilt]. */
/** `glow` is the strength of the soft light in the top-left corner; night variants keep it faint. */
function waves(sky: [string, string], bands: [string, string][], glow: number) {
  const shapes = [
    [260, 70, 0.9, 0.4, -120],
    [360, 90, 1.1, 2.1, -60],
    [470, 80, 0.8, 4.0, 40],
    [580, 110, 1.3, 1.2, 80],
    [700, 90, 1.0, 3.3, 60],
    [830, 70, 1.4, 5.1, 20],
  ] as const;
  const layers = shapes.map(([base, amp, freq, phase, tilt], i) => {
    const crest: Point[] = [];
    for (let x = -150; x <= W + 150; x += 160) {
      const t = x / W;
      crest.push([x, base + tilt * t + amp * Math.sin(t * Math.PI * 2 * freq + phase)]);
    }
    const line = smooth(crest);
    const [top, bottom] = bands[i] ?? ["#000", "#000"];
    return `${vertical(`b${i}`, [
      [0, top],
      [1, bottom],
    ])}<path d='${line}L${W + 150} ${H + 50}L-150 ${H + 50}Z' fill='url(#b${i})'/><path d='${line}' fill='none' stroke='white' stroke-opacity='.22' stroke-width='3' filter='url(#soft)'/>`;
  });
  return svgUrl(
    `<filter id='soft'><feGaussianBlur stdDeviation='3'/></filter>${vertical("sky", [
      [0, sky[0]],
      [1, sky[1]],
    ])}<radialGradient id='glow' cx='.2' cy='.1' r='.7'><stop offset='0' stop-color='white' stop-opacity='${glow}'/><stop offset='1' stop-color='white' stop-opacity='0'/></radialGradient><rect width='${W}' height='${H}' fill='url(#sky)'/>${layers.join("")}<rect width='${W}' height='${H}' fill='url(#glow)'/>`,
  );
}

/** Jagged ridge by midpoint displacement. */
function ridge(rand: () => number, left: number, right: number, roughness: number) {
  let points: Point[] = [
    [-50, left],
    [W + 50, right],
  ];
  let amp = roughness;
  for (let step = 0; step < 7; step++) {
    const next: Point[] = [];
    points.forEach((p, i) => {
      next.push(p);
      const q = points[i + 1];
      if (q) next.push([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + (rand() - 0.5) * amp]);
    });
    points = next;
    amp *= 0.55;
  }
  return `M${points.map((p) => p.map(Math.round).join(" ")).join("L")}L${W + 50} ${H}L-50 ${H}Z`;
}

interface Palette {
  sky: [string, string];
  peaks: [string, string, string];
  slate: [string, string];
  lake: [string, string];
  hills: [string, string];
  front: [string, string];
  stars: boolean;
}

/** Snow peaks over a lake; the peak gradient starts white at the highest summit. */
function peaks(p: Palette) {
  const rand = seeded(7);
  const stars = p.stars
    ? Array.from(
        { length: 70 },
        () =>
          `<circle cx='${Math.round(rand() * W)}' cy='${Math.round(rand() * 380)}' r='${(rand() * 1.2 + 0.3).toFixed(1)}' fill='white' opacity='${(rand() * 0.6 + 0.3).toFixed(2)}'/>`,
      ).join("")
    : "";
  // A band of mist at the foot of the peaks separates them from the slopes in front.
  const haze = `<rect y='480' width='${W}' height='160' fill='url(#hz)'/>`;
  const glints = Array.from(
    { length: 14 },
    () =>
      `<rect x='${Math.round(rand() * W)}' y='${Math.round(630 + rand() * 90)}' width='${Math.round(40 + rand() * 160)}' height='1.5' fill='white' opacity='${(rand() * 0.25 + 0.1).toFixed(2)}'/>`,
  ).join("");
  const two = (id: string, [a, b]: [string, string]) =>
    vertical(id, [
      [0, a],
      [1, b],
    ]);
  return svgUrl(
    `${two("sky", p.sky)}${vertical("pk", [
      [0, p.peaks[0]],
      [0.1, p.peaks[1]],
      [0.45, p.peaks[2]],
    ])}${vertical("hz", [
      [0, "rgba(255,255,255,0)"],
      [0.6, p.stars ? "rgba(160,180,220,.18)" : "rgba(255,255,255,.45)"],
      [1, "rgba(255,255,255,0)"],
    ])}${two("sl", p.slate)}${two("lk", p.lake)}${two("hl", p.hills)}${two("fr", p.front)}<rect width='${W}' height='${H}' fill='url(#sky)'/>${stars}<path d='${ridge(rand, 430, 470, 300)}' fill='url(#pk)' opacity='.55'/><path d='${ridge(rand, 480, 430, 440)}' fill='url(#pk)'/>${haze}<path d='${ridge(rand, 600, 560, 200)}' fill='url(#sl)'/><rect y='620' width='${W}' height='${H - 620}' fill='url(#lk)'/>${glints}<path d='${ridge(rand, 760, 680, 170)}' fill='url(#hl)'/><path d='${ridge(rand, 860, 900, 130)}' fill='url(#fr)'/>`,
  );
}

const mesh = (base: string, ...blobs: [string, string][]) =>
  [...blobs.map(([at, color]) => `radial-gradient(at ${at}, ${color} 0px, transparent 55%)`), base].join(", ");

export const WALLPAPERS = [
  {
    name: "Tahoe",
    light: waves(
      ["#e4efff", "#8fb8f2"],
      [
        ["#c4dcfc", "#8cb7f2"],
        ["#9cc4f7", "#5d95ea"],
        ["#6ea6f0", "#3a7ae0"],
        ["#4a8ae8", "#1f5fd2"],
        ["#2f70dc", "#1449b8"],
        ["#1a56c8", "#0b3290"],
      ],
      0.45,
    ),
    dark: waves(
      ["#070d22", "#13254f"],
      [
        ["#1d3770", "#13265a"],
        ["#183065", "#0f1f4c"],
        ["#142a5a", "#0c1a42"],
        ["#10234e", "#091538"],
        ["#0c1c42", "#06102c"],
        ["#081536", "#040a20"],
      ],
      0.08,
    ),
  },
  {
    name: "Peaks",
    light: peaks({
      sky: ["#8fb3d9", "#e7edf1"],
      peaks: ["#f7f9fb", "#c3cfdb", "#7f91a6"],
      slate: ["#6d7f8f", "#3e4c57"],
      lake: ["#6f9cc8", "#2f5d8c"],
      hills: ["#8e9a45", "#465522"],
      front: ["#5c6a2c", "#232d10"],
      stars: false,
    }),
    dark: peaks({
      sky: ["#060a18", "#28314f"],
      peaks: ["#cdd6e6", "#4a5674", "#1c2338"],
      slate: ["#2a3346", "#151b28"],
      lake: ["#26365a", "#0c1324"],
      hills: ["#2e3820", "#12180b"],
      front: ["#1d2412", "#080b04"],
      stars: true,
    }),
  },
  {
    name: "Lagoon",
    light: mesh(
      "#8ec5fc",
      ["10% 20%", "#e0c3fc"],
      ["80% 10%", "#5ee7df"],
      ["60% 90%", "#4facfe"],
      ["0% 100%", "#b490ca"],
    ),
    dark: mesh(
      "#0b1026",
      ["10% 20%", "#3a1c71"],
      ["80% 10%", "#0f4c75"],
      ["60% 90%", "#1b262c"],
      ["0% 100%", "#5b247a"],
    ),
  },
  {
    name: "Ember",
    light: mesh(
      "#ffd194",
      ["0% 0%", "#ff9a8b"],
      ["100% 0%", "#ff6a88"],
      ["50% 100%", "#ffecd2"],
      ["100% 100%", "#fcb69f"],
    ),
    dark: mesh(
      "#1a0b0b",
      ["0% 0%", "#7f1d1d"],
      ["100% 0%", "#9a3412"],
      ["50% 100%", "#3b0a2a"],
      ["100% 100%", "#4c1d95"],
    ),
  },
  {
    name: "Meadow",
    light: mesh(
      "#d4fc79",
      ["20% 10%", "#96e6a1"],
      ["90% 30%", "#84fab0"],
      ["30% 90%", "#8fd3f4"],
      ["90% 90%", "#c2e9fb"],
    ),
    dark: mesh(
      "#04140f",
      ["20% 10%", "#134e4a"],
      ["90% 30%", "#065f46"],
      ["30% 90%", "#0c4a6e"],
      ["90% 90%", "#14532d"],
    ),
  },
  {
    name: "Dusk",
    light: mesh(
      "#fbc2eb",
      ["0% 50%", "#a18cd1"],
      ["100% 0%", "#fad0c4"],
      ["70% 100%", "#a6c1ee"],
      ["30% 0%", "#f6d365"],
    ),
    dark: mesh(
      "#120d1f",
      ["0% 50%", "#4c1d95"],
      ["100% 0%", "#831843"],
      ["70% 100%", "#1e3a8a"],
      ["30% 0%", "#7c2d12"],
    ),
  },
  {
    name: "Graphite",
    light: mesh("#e2e8f0", ["0% 0%", "#cbd5e1"], ["100% 100%", "#94a3b8"], ["100% 0%", "#f1f5f9"]),
    dark: mesh("#0a0a0a", ["0% 0%", "#27272a"], ["100% 100%", "#18181b"], ["100% 0%", "#3f3f46"]),
  },
];
