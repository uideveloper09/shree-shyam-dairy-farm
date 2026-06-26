"use client";

import { useEffect, useState } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !prompt) return null;

  return (
    <div className="mb-4 rounded-xl border border-[#C89B3C]/40 bg-[#C89B3C]/10 p-4">
      <p className="text-sm font-medium text-white">Install Shree Shyam App</p>
      <p className="mt-1 text-xs text-white/60">
        Add to home screen for offline access and push alerts.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await prompt.prompt();
            setVisible(false);
          }}
          className="rounded-lg bg-[#C89B3C] px-3 py-1.5 text-xs font-semibold text-[#082F63]"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-lg px-3 py-1.5 text-xs text-white/60"
        >
          Later
        </button>
      </div>
    </div>
  );
}
