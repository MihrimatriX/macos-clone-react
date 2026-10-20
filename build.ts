import { rm } from "node:fs/promises";
import path from "node:path";
import tailwind from "bun-plugin-tailwind";

const outdir = path.join(process.cwd(), "dist");
await rm(outdir, { recursive: true, force: true });

const entrypoints = [...new Bun.Glob("src/**/*.html").scanSync()];

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [tailwind],
  minify: true,
  // Apps are React.lazy imports; splitting turns each into its own chunk.
  splitting: true,
  target: "browser",
  sourcemap: "linked",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

// Static hosts serve the social preview image from the site root (see og:image in index.html).
await Bun.write(path.join(outdir, "og.png"), Bun.file("docs/screenshot.png"));

for (const output of result.outputs) {
  process.stdout.write(` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB
`);
}
