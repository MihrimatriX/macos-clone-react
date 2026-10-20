import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Only Chromium accepts url() in backdrop-filter; elsewhere the whole declaration would be dropped,
// taking the blur with it. userAgentData is a Chromium-only API, so it doubles as the feature test.
if ("userAgentData" in navigator) document.documentElement.style.setProperty("--refract", "url(#liquid)");

const elem = document.getElementById("root");
if (!elem) throw new Error("#root missing");

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Reuse the root across hot reloads so state survives edits; production builds drop this branch.
if (import.meta.hot) {
  import.meta.hot.data.root ??= createRoot(elem);
  import.meta.hot.data.root.render(app);
} else {
  createRoot(elem).render(app);
}
