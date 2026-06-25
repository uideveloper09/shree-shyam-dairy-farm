"use client";

import { useEffect, useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER } from "@/lib/layout";
import BrandLogo from "@/components/ui/BrandLogo";
import CartButton from "@/components/ui/CartButton";

export default function Navbar() {
  const { site, navLinks } = useSiteData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* iOS-safe scroll lock when mobile menu is open */
  useEffect(() => {
    if (!menuOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  const scrollTo = (href) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveHash(href);
    setMenuOpen(false);
  };

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
          <button
            type="button"
            onClick={() => scrollTo("#home")}
            className="min-w-0 shrink"
            aria-label={site.name}
          >
            <BrandLogo variant="light" compact className="max-w-[calc(100vw-7.5rem)] sm:max-w-none" />
          </button>

          <nav
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const active = activeHash === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollTo(link.href)}
                  className={`relative whitespace-nowrap px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] transition xl:px-4 xl:text-[13px] ${
                    active ? "text-[#082F63]" : "text-gray-600 hover:text-[#082F63]"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-[#C89B3C] transition-all duration-300 ${
                      active ? "w-4/5" : "w-0"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CartButton />
            <button
              type="button"
              onClick={() => scrollTo("#products")}
              className="btn-premium-navy hidden h-9 px-4 text-[10px] sm:inline-flex sm:h-10 sm:px-5 sm:text-[11px]"
            >
              Shop Now
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-[#082F63] sm:h-10 sm:w-10 lg:hidden"
            >
              {menuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-[#eee] bg-white shadow-xl sm:top-16 lg:hidden">
            <nav className={`${CONTAINER} flex flex-col gap-1 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]`}>
              {navLinks.map((link) => {
                const active = activeHash === link.href;
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => scrollTo(link.href)}
                    className={`rounded-lg px-4 py-3.5 text-left text-[15px] font-medium transition ${
                      active
                        ? "bg-[#082F63]/5 text-[#082F63]"
                        : "text-gray-700 hover:bg-[#faf9f6] hover:text-[#082F63]"
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => scrollTo("#products")}
                className="btn-premium-navy mt-3 h-12 w-full"
              >
                Shop Now
              </button>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
