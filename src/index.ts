import { serve } from "bun";
import index from "./index.html";

const server = serve({
  // Every path renders the SPA except the social preview image.
  routes: { "/og.png": new Response(Bun.file("docs/screenshot.png")), "/*": index },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

process.stdout.write(`Server running at ${server.url}\n`);
