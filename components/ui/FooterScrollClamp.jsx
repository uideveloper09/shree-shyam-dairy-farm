"use client";

import { useEffect } from "react";

function getMaxScroll() {
  const footer = document.querySelector("footer");
  if (!footer) return 0;

  const footerBottom = footer.getBoundingClientRect().bottom + window.scrollY;
  return Math.max(0, Math.ceil(footerBottom - window.innerHeight));
}

export default function FooterScrollClamp() {
  useEffect(() => {
    let maxScroll = getMaxScroll();

    const update = () => {
      maxScroll = getMaxScroll();
    };

    const onScroll = () => {
      if (window.scrollY > maxScroll + 1) {
        window.scrollTo(0, maxScroll);
      }
    };

    update();
    const t1 = window.setTimeout(update, 150);
    const t2 = window.setTimeout(update, 800);
    const t3 = window.setTimeout(update, 2500);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update);
    window.addEventListener("pageshow", update);

    const footer = document.querySelector("footer");
    const observer = footer ? new ResizeObserver(update) : null;
    observer?.observe(footer);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("pageshow", update);
      observer?.disconnect();
    };
  }, []);

  return null;
}
