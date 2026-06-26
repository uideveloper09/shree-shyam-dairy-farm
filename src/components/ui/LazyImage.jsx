"use client";

import { useState } from "react";
import Image from "next/image";

export default function LazyImage({
  className = "",
  wrapperClassName = "",
  priority = false,
  fill,
  onLoad,
  alt,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const image = (
    <>
      {!loaded && <div className="lazy-shimmer absolute inset-0 z-[1]" aria-hidden />}
      <Image
        alt={alt}
        fill={fill}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        onLoad={handleLoad}
        className={`${className} transition-all duration-500 ease-out ${
          loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-[6px] scale-[1.02]"
        }`}
        {...props}
      />
    </>
  );

  if (fill) {
    return <div className={`absolute inset-0 overflow-hidden ${wrapperClassName}`}>{image}</div>;
  }

  return <div className={`relative overflow-hidden ${wrapperClassName}`}>{image}</div>;
}
