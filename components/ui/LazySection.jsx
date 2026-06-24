"use client";

import { useEffect, useRef, useState } from "react";

export default function LazySection({
  children,
  skeleton,
  rootMargin = "280px",
  threshold = 0.01,
  minHeight,
  className = "",
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

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
  }, [rootMargin, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={minHeight && !visible ? { minHeight } : undefined}
    >
      {visible ? (
        <div className="lazy-fade-in">{children}</div>
      ) : (
        skeleton
      )}
    </div>
  );
}
