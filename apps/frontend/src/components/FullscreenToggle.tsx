"use client";

import { useEffect, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

/** Uses the real browser Fullscreen API — hides the browser's own chrome (address bar,
 * tabs) so the app fills the whole screen, not an in-app "hide the sidebar" mode. */
export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        // Denied (no user-gesture context, disallowed in an embedding iframe, etc.) —
        // fail silently; the button simply won't change state.
      });
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      className="rounded p-1.5 text-graphite-500 hover:bg-canvas hover:text-graphite-900"
    >
      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  );
}
