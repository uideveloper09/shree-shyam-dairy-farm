"use client";

import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 500;
const FADE_MS = 350;

export default function PageLoader() {
  const [progress, setProgress] = useState(8);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let current = 8;
    let intervalId;
    let finishTimeoutId;
    let hideTimeoutId;

    const tick = () => {
      const bump = Math.random() * 12 + 4;
      current = Math.min(current + bump, 92);
      setProgress(current);
    };

    intervalId = window.setInterval(tick, 180);

    const finish = () => {
      window.clearInterval(intervalId);
      setProgress(100);

      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

      finishTimeoutId = window.setTimeout(() => {
        setFadeOut(true);
        hideTimeoutId = window.setTimeout(() => setHidden(true), FADE_MS);
      }, wait + 150);
    };

    const maxHideTimeoutId = window.setTimeout(() => {
      setFadeOut(true);
      setHidden(true);
    }, 2000);

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(finishTimeoutId);
      window.clearTimeout(hideTimeoutId);
      window.clearTimeout(maxHideTimeoutId);
      window.removeEventListener("load", finish);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <div
        className="relative h-full bg-gradient-to-r from-[#082F63] via-[#0B3D7A] to-[#C89B3C] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      >
        <span className="absolute right-0 top-0 h-full w-8 bg-[#C89B3C]/80 blur-[2px]" />
      </div>
    </div>
  );
}
