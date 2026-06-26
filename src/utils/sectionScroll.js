import { forceMountSection } from "@/utils/sectionMountRegistry";

export function scrollToSectionElement(sectionId, { smooth = true } = {}) {
  if (typeof window === "undefined" || !sectionId) return false;

  if (window.location.pathname === "/") {
    window.history.replaceState(null, "", "/");
  }

  const el = document.getElementById(sectionId);
  if (!el || el.offsetHeight === 0) return false;

  el.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "start",
  });

  return true;
}

export function scrollToSectionWhenReady(sectionId, { smooth = true, attempts = 120 } = {}) {
  if (!sectionId) return;

  forceMountSection(sectionId);

  let count = 0;
  const tick = () => {
    if (scrollToSectionElement(sectionId, { smooth: smooth && count > 2 })) return;

    count += 1;
    if (count < attempts) {
      forceMountSection(sectionId);
      setTimeout(tick, count < 25 ? 32 : 64);
    }
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(tick);
  });
}

/** Preload sections that sit above the scroll target (so page height is stable) */
export function forceMountSectionsThrough(sectionIds, targetId) {
  const targetIndex = sectionIds.indexOf(targetId);
  if (targetIndex === -1) {
    forceMountSection(targetId);
    return;
  }

  for (let i = 0; i <= targetIndex; i += 1) {
    forceMountSection(sectionIds[i]);
  }
}
