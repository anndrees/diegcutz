import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/editorial.css";

// A stale cached version can reference files that no longer exist after an update,
// leaving a blank page. Reload once to pick up the current version.
const RELOAD_KEY = "dc-stale-reload";
const recoverOnce = () => {
  if (sessionStorage.getItem(RELOAD_KEY)) return;
  sessionStorage.setItem(RELOAD_KEY, "1");
  window.location.reload();
};
window.addEventListener("vite:preloadError", (e) => { e.preventDefault(); recoverOnce(); });
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e.reason as Error)?.message ?? e.reason ?? "");
  if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(msg)) recoverOnce();
});
window.setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 10000);

createRoot(document.getElementById("root")!).render(<App />);
