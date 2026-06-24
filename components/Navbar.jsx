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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
        scrolled
          ? "border-b border-[#eee]/80 bg-white/95 shadow-[0_4px_24px_rgba(8,47,99,0.08)] backdrop-blur-md"
          : "border-b border-[#eee] bg-white"
      }`}
    >
      <div className={CONTAINER}>
        <div className="flex h-[76px] items-center gap-4 lg:h-[84px]">
          <button
            type="button"
            onClick={() => scrollTo("#home")}
            className="shrink-0"
            aria-label={site.name}
          >
            <BrandLogo variant="light" />
          </button>

          <nav
            className="hidden flex-1 items-center justify-center gap-1 xl:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const active = activeHash === link.href;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollTo(link.href)}
                  className={`relative px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.06em] transition ${
                    active ? "text-[#082F63]" : "text-gray-600 hover:text-[#082F63]"
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-[#C89B3C] transition-all duration-300 ${
                      active ? "w-4/5" : "w-0 group-hover:w-4/5"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <CartButton />
            <button
              type="button"
              onClick={() => scrollTo("#products")}
              className="btn-premium-navy hidden h-10 px-5 text-[11px] sm:inline-flex"
            >
              Shop Now
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[#082F63] xl:hidden"
            >
              {menuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[#eee] bg-white/98 backdrop-blur-md xl:hidden">
          <nav className={`${CONTAINER} flex flex-col gap-1 py-4`}>
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="rounded-lg px-4 py-3 text-left text-[14px] font-medium text-gray-700 transition hover:bg-[#faf9f6] hover:text-[#082F63]"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => scrollTo("#products")}
              className="btn-premium-navy mt-2 h-11 w-full"
            >
              Shop Now
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
