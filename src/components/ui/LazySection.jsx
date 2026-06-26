"use client";

import { useEffect, useRef, useState } from "react";
import { SECTION_SCROLL_EVENT } from "@/utils/routes";
import { registerSectionMount } from "@/utils/sectionMountRegistry";

export default function LazySection({
  children,
  skeleton,
  sectionId,
  rootMargin = "800px 0px 400px 0px",
  threshold = 0,
  minHeight,
  className = "",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!sectionId) return undefined;

    return registerSectionMount(sectionId, () => {
      setVisible(true);
    });
  }, [sectionId]);

  useEffect(() => {
    if (!sectionId) return undefined;

    const onScrollRequest = (e) => {
      if (e.detail?.id === sectionId) setVisible(true);
    };

    window.addEventListener(SECTION_SCROLL_EVENT, onScrollRequest);
    return () => window.removeEventListener(SECTION_SCROLL_EVENT, onScrollRequest);
  }, [sectionId]);

  useEffect(() => {
    if (visible) return undefined;

    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, visible]);

  return (
    <div ref={ref} className={className} style={minHeight && !visible ? { minHeight } : undefined}>
      {visible ? <div className="lazy-fade-in">{children}</div> : skeleton}
    </div>
  );
}
