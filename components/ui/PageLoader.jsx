"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const MIN_VISIBLE_MS = 700;
const FADE_MS = 450;

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
      }, wait + 250);
    };

    const maxHideTimeoutId = window.setTimeout(() => {
      setFadeOut(true);
      setHidden(true);
    }, 3000);

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
    <>
      {/* Facebook-style top progress bar */}
      <div
        className={`fixed inset-x-0 top-0 z-[100] h-[3px] bg-[#e8e4dc]/80 transition-opacity duration-300 ${
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

      {/* Full-page skeleton overlay */}
      <div
        className={`fixed inset-0 z-[99] bg-[#faf9f6] transition-opacity duration-500 ${
          fadeOut ? "pointer-events-none opacity-0" : "pointer-events-none opacity-100"
        }`}
        aria-busy={!fadeOut}
        aria-label="Loading page"
      >
        <div className="mx-auto flex h-full max-w-[1280px] flex-col px-4 sm:px-6 lg:px-10">
          {/* Logo */}
          <div className="flex items-center justify-center pt-8 pb-6">
            <div className="flex items-center gap-3">
              <div className="lazy-shimmer h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <div className="lazy-shimmer h-3 w-28 rounded" />
                <div className="lazy-shimmer h-2.5 w-36 rounded" />
              </div>
            </div>
          </div>

          {/* Nav skeleton */}
          <div className="lazy-shimmer mb-4 h-11 w-full rounded-xl" />

          {/* Hero skeleton */}
          <div className="lazy-shimmer mb-6 h-[280px] w-full rounded-2xl sm:h-[340px] lg:h-[400px]" />

          {/* Section title */}
          <div className="mb-4 space-y-2">
            <div className="lazy-shimmer h-3 w-24 rounded" />
            <div className="lazy-shimmer h-7 w-56 rounded" />
          </div>

          {/* Product cards row — Facebook feed style */}
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[240px] shrink-0 overflow-hidden rounded-2xl border border-[#eee] bg-white p-3 sm:w-[260px]"
              >
                <div className="lazy-shimmer aspect-square w-full rounded-xl" />
                <div className="mt-3 space-y-2">
                  <div className="lazy-shimmer h-3.5 w-4/5 rounded" />
                  <div className="lazy-shimmer h-3 w-1/2 rounded" />
                  <div className="lazy-shimmer mt-3 h-10 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom hint with real logo pulse */}
          <div className="mt-auto flex justify-center pb-10 pt-8">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/logos/logo-footer.png"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 animate-pulse rounded-full opacity-70"
                priority
              />
              <p className="text-[11px] font-medium tracking-wide text-[#082F63]/40">
                Loading fresh goodness...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
