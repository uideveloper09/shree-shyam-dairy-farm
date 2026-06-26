"use client";

import { useEffect } from "react";

function unlockPageScroll() {
  document.documentElement.style.overflow = "";
  document.documentElement.style.overflowY = "";
  document.body.style.overflow = "";
  document.body.style.overflowY = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.body.style.marginBottom = "";
  document.body.style.touchAction = "";
}

export default function ScrollUnlock() {
  useEffect(() => {
    unlockPageScroll();
    window.addEventListener("pageshow", unlockPageScroll);
    return () => window.removeEventListener("pageshow", unlockPageScroll);
  }, []);

  return null;
}
