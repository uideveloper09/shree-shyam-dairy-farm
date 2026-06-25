"use client";

import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaChevronRight,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa";
import Image from "next/image";
import { useSiteData } from "@/context/SiteDataContext";
import { Newsletter, FooterColHeading } from "@/components/AboutStrip";
import { CONTAINER } from "@/lib/layout";

const SOCIAL_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
};

function FooterLink({ href, children, showChevron = false }) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 text-[13px] text-white/55 transition hover:text-[#C89B3C]"
    >
      {showChevron && (
        <FaChevronRight
          size={7}
          className="shrink-0 text-[#C89B3C]/70 transition group-hover:translate-x-0.5"
        />
      )}
      {children}
    </a>
  );
}

function ContactRow({ icon: Icon, href, children }) {
  const content = (
    <span className="flex min-w-0 items-start gap-2.5 text-[13px] leading-snug text-white/60 transition group-hover:text-white/90">
      <Icon size={12} className="mt-0.5 shrink-0 text-[#C89B3C]" />
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} className="group block">
        {content}
      </a>
    );
  }
  return content;
}

export default function Footer({ showTagline = true }) {
  const { site, socialLinks, footerLinks } = useSiteData();
  const year = new Date().getFullYear();

  return (
    <footer className="relative shrink-0 overflow-hidden bg-[#082F63]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 100%, #C89B3C 0%, transparent 45%), radial-gradient(circle at 100% 0%, #ffffff 0%, transparent 35%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B3C]/60 to-transparent" />

      <div className={`${CONTAINER} relative z-10 pt-16 pb-10 sm:pt-20`}>
        {/* Main links — 4 equal columns, no squeeze */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10 xl:gap-x-14">
          {/* Brand */}
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <a href="#home" aria-label={site.name} className="shrink-0">
                <Image
                  src="/logos/logo-footer.png"
                  alt="Logo"
                  width={60}
                  height={60}
                  className="h-[60px] w-[60px] rounded-full ring-2 ring-[#C89B3C]/30"
                />
              </a>
              <div className="min-w-0">
                <p className="font-logo text-[17px] font-bold uppercase leading-tight tracking-[0.1em] text-white">
                  SHREE SHYAM
                  <br />
                  DAIRY FARM
                </p>
                {showTagline && (
                  <p className="font-tagline mt-1 text-[12px] text-[#C89B3C]/90">
                    {site.logoTagline}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-[1.75] text-white/50">{site.footerDesc}</p>
            <div className="mt-5 flex gap-2.5">
              {socialLinks.map(({ label, href, icon }) => {
                const Icon = SOCIAL_ICONS[icon];
                return (
                  <a
                    key={icon}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/65 transition hover:border-[#C89B3C]/50 hover:text-[#C89B3C]"
                  >
                    <Icon size={13} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="min-w-0">
            <FooterColHeading title="Quick Links" />
            <ul className="space-y-2.5">
              {footerLinks.quick.map((l) => (
                <li key={l.href + l.label}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="min-w-0">
            <FooterColHeading title="Our Products" />
            <ul className="space-y-2.5">
              {footerLinks.products.map((p) => (
                <li key={p.label}>
                  <FooterLink href={p.href} showChevron>
                    {p.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — full column width, no overlap */}
          <div className="min-w-0">
            <FooterColHeading title="Contact Us" />
            <ul className="space-y-3">
              <li>
                <ContactRow icon={FaMapMarkerAlt}>{site.location}</ContactRow>
              </li>
              <li>
                <ContactRow icon={FaPhoneAlt} href={`tel:${site.phone.replace(/\s/g, "")}`}>
                  {site.phone}
                </ContactRow>
              </li>
              <li>
                <ContactRow icon={FaEnvelope} href={`mailto:${site.email}`}>
                  {site.email}
                </ContactRow>
              </li>
              <li>
                <ContactRow icon={FaClock}>{site.hours}</ContactRow>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter — full width row, separate from contact */}
        <div className="mt-12">
          <Newsletter premium layout="bar" />
        </div>

        {/* Tagline */}
        <div className="relative mt-12 border-t border-white/10 pt-8">
          <p className="mx-auto max-w-xl text-center font-tagline text-[15px] leading-[1.8] text-white/50">
            {site.footerTagline}{" "}
            <strong className="font-semibold text-white/80">{site.name}</strong> — where freshness
            is delivered to perfection.
          </p>
        </div>
      </div>

      {/* Copyright — flush to page bottom */}
      <div className="border-t border-white/[0.06] bg-[#061E3D] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div
          className={`${CONTAINER} flex flex-col items-center justify-between gap-2 py-4 sm:flex-row`}
        >
          <p className="text-[11px] text-white/40">
            &copy; {year} {site.name}. All Rights Reserved.
          </p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#C89B3C]/55">
            Farm Se Seedha Aapke Ghar Tak
          </p>
        </div>
      </div>
    </footer>
  );
}
