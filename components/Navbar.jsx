/**
 * Navbar
 * ──────
 * Sticky Navbar + Cart Integration
 */

"use client";

import { useEffect, useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

import { NAV_LINKS, SITE } from "@/lib/site";
import { CONTAINER } from "@/lib/layout";

import BrandLogo from "@/components/ui/BrandLogo";
import CartButton from "@/components/ui/CartButton";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("#home");
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setActiveHash(`#${sectionId}`);
  };

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      setActiveHash(window.location.hash || "#home");
    };

    update();

    window.addEventListener("hashchange", update);

    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${
        scrolled ? "shadow-[0_2px_20px_rgba(8,47,99,0.10)]" : ""
      }`}
    >
      <div className={CONTAINER}>
        <div className="flex items-center h-[90px] gap-6">
          {/* Logo */}
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="shrink-0"
            aria-label={SITE.name}
          >
            <BrandLogo variant="light" />
          </button>

          {/* Desktop Navigation */}
          <nav
            className="hidden xl:flex flex-1 items-center justify-center gap-8"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => {
              const active =
                activeHash === link.href ||
                (activeHash === "" && link.href === "#home");

              return (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href.replace("#", ""))}
                  className={`relative pb-2 text-[13px] uppercase tracking-[0.06em] transition whitespace-nowrap ${
                    active
                      ? "text-[#082F63] font-bold"
                      : "text-[#555] font-medium hover:text-[#082F63]"
                  }`}
                >
                  {link.label}

                  {active && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C89B3C]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4 ml-auto xl:ml-0">
            {/* Cart */}
            <div className="hidden sm:flex">
              <CartButton />
            </div>

            {/* Order Button */}
            <a
              href="#contact"
              className="hidden sm:inline-flex items-center justify-center h-11 px-7 rounded bg-[#082F63] text-white text-[13px] font-bold uppercase tracking-[0.08em] hover:bg-[#0B3D7A] transition"
            >
              Order Now
            </a>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="xl:hidden flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E5E5] text-[#082F63]"
            >
              {menuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="xl:hidden border-t border-[#E5E5E5] bg-white">
          <nav className={`${CONTAINER} py-5 flex flex-col gap-1`}>
            {/* Mobile Cart */}
            <div className="px-4 py-3 border-b border-[#E5E5E5] mb-3">
              <CartButton />
            </div>

            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => {
                  const sectionId = link.href.replace("#", "");

                  document.getElementById(sectionId)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });

                  setActiveHash(link.href);
                  setMenuOpen(false);
                }}
                className="w-full text-left rounded-md px-4 py-3 text-[13px] font-medium uppercase tracking-[0.06em] text-[#555] hover:bg-[#F7F7F7] hover:text-[#082F63]"
              >
                {link.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                document.getElementById("contact")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });

                setMenuOpen(false);
              }}
              className="mt-4 w-full flex items-center justify-center h-11 rounded bg-[#082F63] text-white text-[13px] font-bold uppercase tracking-[0.08em] hover:bg-[#0B3D7A] transition"
            >
              Order Now
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
