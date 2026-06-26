"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSectionId, isSectionLink } from "@/utils/routes";
import { forceMountSectionsThrough, scrollToSectionWhenReady } from "@/utils/sectionScroll";

const SectionScrollContext = createContext(null);

export function SectionScrollProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const pendingSectionRef = useRef(null);
  const sectionOrderRef = useRef([]);

  const registerHomeSectionOrder = useCallback((order) => {
    sectionOrderRef.current = order;
  }, []);

  const scrollToSection = useCallback((sectionId, { smooth = true } = {}) => {
    if (!sectionId) return;

    const order = sectionOrderRef.current;
    if (order.length) {
      forceMountSectionsThrough(order, sectionId);
    } else {
      forceMountSectionsThrough([sectionId], sectionId);
    }

    scrollToSectionWhenReady(sectionId, { smooth });
  }, []);

  const navigateToSection = useCallback(
    (target, { smooth = true } = {}) => {
      const sectionId = getSectionId(target);
      if (!sectionId) return null;

      if (pathname === "/") {
        scrollToSection(sectionId, { smooth });
      } else {
        pendingSectionRef.current = sectionId;
        router.push("/");
      }

      return sectionId;
    },
    [pathname, router, scrollToSection]
  );

  useEffect(() => {
    if (pathname !== "/" || !pendingSectionRef.current) return;

    const sectionId = pendingSectionRef.current;
    pendingSectionRef.current = null;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToSection(sectionId, { smooth: true });
      });
    });
  }, [pathname, scrollToSection]);

  const handleSectionClick = useCallback(
    (e, href) => {
      if (!isSectionLink(href)) return null;
      e?.preventDefault();
      return navigateToSection(href);
    },
    [navigateToSection]
  );

  return (
    <SectionScrollContext.Provider
      value={{
        navigateToSection,
        scrollToSection,
        handleSectionClick,
        registerHomeSectionOrder,
      }}
    >
      {children}
    </SectionScrollContext.Provider>
  );
}

export function useSectionScroll() {
  const ctx = useContext(SectionScrollContext);
  if (!ctx) {
    throw new Error("useSectionScroll must be used within SectionScrollProvider");
  }
  return ctx;
}
