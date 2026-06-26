"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteData } from "@/features/cart/context/SiteDataContext";
import { CONTAINER } from "@/constants/layout";
import BrandLogo from "@/components/ui/BrandLogo";
import CartButton from "@/components/ui/CartButton";
import { isSectionLink, resolveNavHref, getSectionId } from "@/utils/routes";
import { useSectionScroll } from "@/features/cart/context/SectionScrollContext";

const drawerVariants = {
  hidden: { opacity: 0, y: -24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 26, stiffness: 320, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.99,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.05 + i * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Navbar({ embedInStickyShell = false }) {
  const { site, navLinks } = useSiteData();
  const pathname = usePathname();
  const { handleSectionClick } = useSectionScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [homeActiveSection, setHomeActiveSection] = useState("");
  const activeSection = pathname === "/" ? homeActiveSection : "";

  useEffect(() => {
    if (pathname !== "/") return;

    const sectionIds = navLinks
      .filter((link) => isSectionLink(link.href))
      .map((link) => getSectionId(link.href));

    if (!sectionIds.length) return;

    const visible = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let best = "";
        let bestRatio = 0;
        for (const id of sectionIds) {
          const ratio = visible.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = id;
          }
        }
        if (best && bestRatio > 0.15) setHomeActiveSection(best);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.15, 0.35, 0.55, 0.75] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname, navLinks]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  }, []);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        window.dispatchEvent(new Event("resize"));
      });
    };
  }, [menuOpen]);

  const scrollToSection = (href, e) => {
    const id = handleSectionClick(e, href);
    if (id) setHomeActiveSection(id);
    setMenuOpen(false);
  };

  const isLinkActive = (href) => {
    if (isSectionLink(href)) {
      const id = getSectionId(href);
      return pathname === "/" && activeSection === id;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItemClass = (href) =>
    `relative whitespace-nowrap px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition xl:px-4 xl:text-[13px] ${
      isLinkActive(href) ? "text-[#082F63]" : "text-gray-600 hover:text-[#082F63]"
    }`;

  const mobileNavItemClass = (href) =>
    `rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition ${
      isLinkActive(href)
        ? "bg-[#082F63]/8 text-[#082F63] ring-1 ring-[#C89B3C]/30"
        : "text-gray-700 hover:bg-[#faf9f6] hover:text-[#082F63]"
    }`;

  return (
    <header
      className={`w-full transition-all duration-300 ${
        embedInStickyShell ? "relative" : "sticky top-0 z-50"
      } ${
        scrolled || menuOpen
          ? "border-b border-[#eee]/80 bg-white/95 shadow-[0_4px_24px_rgba(8,47,99,0.08)] backdrop-blur-md"
          : "border-b border-[#eee] bg-white"
      }`}
    >
      <div className={CONTAINER}>
        <div className="flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-[3.75rem] sm:gap-3 sm:py-2.5 lg:min-h-[58px] lg:gap-3">
          <Link
            href="/"
            className="block min-w-0 overflow-hidden lg:shrink-0"
            aria-label={site.name}
          >
            <BrandLogo variant="light" compact className="max-w-full" />
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const href = resolveNavHref(link.href, pathname);
              const active = isLinkActive(link.href);

              if (isSectionLink(link.href)) {
                return (
                  <Link
                    key={link.href}
                    href={href}
                    onClick={(e) => scrollToSection(link.href, e)}
                    className={navItemClass(link.href)}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-[#C89B3C] transition-all duration-300 ${
                        active ? "w-4/5" : "w-0"
                      }`}
                    />
                  </Link>
                );
              }

              return (
                <Link key={link.href} href={href} className={navItemClass(link.href)}>
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-[#C89B3C] transition-all duration-300 ${
                      active ? "w-4/5" : "w-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:ml-0">
            <CartButton className="h-9 w-9 sm:h-10 sm:w-10" />
            <Link
              href={resolveNavHref("#products", pathname)}
              onClick={(e) => scrollToSection("#products", e)}
              className="btn-premium-navy hidden h-9 px-4 text-[10px] lg:inline-flex lg:h-10 lg:px-5 lg:text-[11px]"
            >
              Shop Now
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-[#082F63] transition active:scale-95 sm:h-10 sm:w-10 lg:hidden"
            >
              <motion.span
                key={menuOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {menuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
              </motion.span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-[#061E3D]/50 backdrop-blur-[2px] lg:hidden"
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-hidden border-t border-[#eee] bg-white shadow-[0_20px_50px_rgba(8,47,99,0.15)] sm:top-16 lg:hidden"
            >
              <nav
                className={`${CONTAINER} flex max-h-[calc(100dvh-3.5rem)] flex-col gap-1 overflow-y-auto py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-h-[calc(100dvh-4rem)]`}
              >
                {navLinks.map((link, i) => {
                  const href = resolveNavHref(link.href, pathname);
                  const active = isLinkActive(link.href);

                  if (isSectionLink(link.href)) {
                    return (
                      <motion.div
                        key={link.href}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          href={href}
                          onClick={(e) => scrollToSection(link.href, e)}
                          className={`block ${mobileNavItemClass(link.href)}`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={link.href}
                      custom={i}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className={`block ${mobileNavItemClass(link.href)}`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.div
                  custom={navLinks.length}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Link
                    href={resolveNavHref("#products", pathname)}
                    onClick={(e) => scrollToSection("#products", e)}
                    className="btn-premium-navy mt-3 flex h-12 w-full items-center justify-center"
                  >
                    Shop Now
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
