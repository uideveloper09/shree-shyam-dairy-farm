"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER } from "@/lib/layout";
import BrandLogo from "@/components/ui/BrandLogo";
import CartButton from "@/components/ui/CartButton";
import { isHashHref, resolveNavHref } from "@/lib/routes";

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

export default function Navbar() {
  const { site, navLinks } = useSiteData();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    if (pathname !== "/") return;
    const syncHash = () => setActiveHash(window.location.hash || "");
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

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

  const scrollToHash = (href) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveHash(href);
    setMenuOpen(false);
  };

  const isLinkActive = (href) => {
    if (isHashHref(href)) {
      return pathname === "/" && activeHash === href;
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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-b border-[#eee]/80 bg-white/95 shadow-[0_4px_24px_rgba(8,47,99,0.08)] backdrop-blur-md"
          : "border-b border-[#eee] bg-white"
      }`}
    >
      <div className={CONTAINER}>
        <div className="flex h-14 min-w-0 items-center gap-2 sm:h-16 sm:gap-3 lg:h-[84px] lg:gap-4">
          <Link href="/" className="min-w-0 shrink" aria-label={site.name}>
            <BrandLogo variant="light" compact className="max-w-[calc(100vw-6.5rem)] sm:max-w-none" />
          </Link>

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const href = resolveNavHref(link.href, pathname);
              const active = isLinkActive(link.href);

              if (isHashHref(link.href) && pathname === "/") {
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => scrollToHash(link.href)}
                    className={navItemClass(link.href)}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-[#C89B3C] transition-all duration-300 ${
                        active ? "w-4/5" : "w-0"
                      }`}
                    />
                  </button>
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CartButton className="h-9 w-9 sm:h-10 sm:w-10" />
            <Link
              href={pathname === "/" ? "#products" : "/#products"}
              className="btn-premium-navy hidden h-9 px-4 text-[10px] md:inline-flex md:h-10 md:px-5 md:text-[11px]"
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

                  if (isHashHref(link.href) && pathname === "/") {
                    return (
                      <motion.button
                        key={link.href}
                        type="button"
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => scrollToHash(link.href)}
                        className={mobileNavItemClass(link.href)}
                      >
                        {link.label}
                      </motion.button>
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
                    href={pathname === "/" ? "#products" : "/#products"}
                    onClick={() => setMenuOpen(false)}
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
