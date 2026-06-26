"use client";

import { createContext, useContext } from "react";

const TenantContext = createContext(null);

export function TenantProvider({ config, children }) {
  return <TenantContext.Provider value={config}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  return useContext(TenantContext);
}
