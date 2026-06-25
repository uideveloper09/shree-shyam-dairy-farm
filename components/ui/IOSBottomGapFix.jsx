"use client";

import { useEffect } from "react";

function clearBodyScrollLock() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
}

function trimPhantomBottomGap() {
  clearBodyScrollLock();

  const footer = document.querySelector("footer");
  if (!footer) return;

  const footerEnd = footer.getBoundingClientRect().bottom + window.scrollY;
  const extra = Math.round(document.documentElement.scrollHeight - footerEnd);

  if (extra > 2) {
    document.body.style.marginBottom = `-${extra}px`;
  } else {
    document.body.style.marginBottom = "";
  }
}

export default function IOSBottomGapFix() {
  useEffect(() => {
    trimPhantomBottomGap();

    const runSoon = () => {
      trimPhantomBottomGap();
      requestAnimationFrame(trimPhantomBottomGap);
    };

    const t1 = window.setTimeout(runSoon, 120);
    const t2 = window.setTimeout(runSoon, 600);
    const t3 = window.setTimeout(runSoon, 1500);

    window.addEventListener("resize", runSoon, { passive: true });
    window.addEventListener("orientationchange", runSoon);
    window.addEventListener("pageshow", runSoon);

    const footer = document.querySelector("footer");
    const observer = footer ? new ResizeObserver(runSoon) : null;
    observer?.observe(footer);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("resize", runSoon);
      window.removeEventListener("orientationchange", runSoon);
      window.removeEventListener("pageshow", runSoon);
      observer?.disconnect();
      document.body.style.marginBottom = "";
      clearBodyScrollLock();
    };
  }, []);

  return null;
}
