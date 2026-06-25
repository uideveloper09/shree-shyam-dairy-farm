import { SECTION_SCROLL_EVENT } from "@/lib/routes";

const mountHandlers = new Map();

export function registerSectionMount(sectionId, handler) {
  if (!sectionId || typeof handler !== "function") return () => {};

  mountHandlers.set(sectionId, handler);
  return () => {
    if (mountHandlers.get(sectionId) === handler) {
      mountHandlers.delete(sectionId);
    }
  };
}

/** Mount a lazy section immediately (nav click or programmatic scroll) */
export function forceMountSection(sectionId) {
  if (!sectionId) return;

  mountHandlers.get(sectionId)?.();

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SECTION_SCROLL_EVENT, { detail: { id: sectionId } })
    );
  }
}

export function requestSectionMount(sectionId) {
  forceMountSection(sectionId);
}
