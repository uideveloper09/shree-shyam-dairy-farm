"use client";

import { createContext, useContext, useMemo } from "react";

const SiteDataContext = createContext(null);

export function SiteDataProvider({ content, children }) {
  const value = useMemo(() => content, [content]);
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error("useSiteData must be used within SiteDataProvider");
  }
  return ctx;
}
