"use client";

import { useState } from "react";
import LazyImage from "@/components/ui/LazyImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER, SECTION_CREAM } from "@/lib/layout";

export default function AboutStrip() {
  const { site, about } = useSiteData();

  return (
    <section id="about" className={SECTION_CREAM}>
      <div className={CONTAINER}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-[#C89B3C]/20 to-[#082F63]/10" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(8,47,99,0.15)] ring-1 ring-white/80">
              <LazyImage
                src={about.image}
                alt={about.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          <div>
            <SectionHeading
              label={about.label}
              title={about.title}
              align="left"
              className="mb-6"
            />
            <p className="text-[16px] leading-[1.85] text-gray-600">
              {site.description} {about.body}
            </p>
            <p className="mt-5 font-tagline text-xl text-[#C89B3C]">{site.hindiTagline}</p>
            <a href={about.cta.href} className="btn-premium-navy mt-8 h-12 px-8">
              {about.cta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FooterColHeading({ title }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C89B3C]">
        {title}
      </span>
      <span className="h-px w-8 bg-[#C89B3C]/40" aria-hidden />
    </div>
  );
}

export function Newsletter({ premium = false, layout = "card" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (premium && layout === "bar") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <div className="shrink-0 lg:max-w-[260px]">
            <FooterColHeading title="Fresh Tips" />
            <p className="text-[13px] leading-relaxed text-white/55">
              Subscribe for offers &amp; farm-fresh arrivals.
            </p>
          </div>

          {status === "done" ? (
            <p className="text-sm font-medium text-[#C89B3C]">Thanks for subscribing!</p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === "loading"}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#C89B3C]/50 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="shrink-0 rounded-lg bg-gradient-to-r from-[#C89B3C] to-[#d4ab5a] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#082F63] transition hover:opacity-95 disabled:opacity-60 sm:whitespace-nowrap"
              >
                {status === "loading" ? "Joining..." : "Join Newsletter"}
              </button>
            </form>
          )}
        </div>
        {status === "error" && (
          <p className="mt-2 text-xs text-red-300">Something went wrong. Try again.</p>
        )}
      </div>
    );
  }

  if (premium) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <FooterColHeading title="Fresh Tips" />
        <p className="mb-4 text-[13px] leading-relaxed text-white/55">
          Subscribe for offers &amp; farm-fresh arrivals.
        </p>
        {status === "done" ? (
          <p className="text-sm font-medium text-[#C89B3C]">Thanks for subscribing!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              disabled={status === "loading"}
              className="w-full rounded-lg border border-white/15 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-[#C89B3C]/50 focus:bg-white/10 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-gradient-to-r from-[#C89B3C] to-[#d4ab5a] py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#082F63] shadow-lg shadow-[#C89B3C]/20 transition hover:from-[#d4ab5a] hover:to-[#C89B3C] disabled:opacity-60"
            >
              {status === "loading" ? "Joining..." : "Join Newsletter"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="mt-2 text-xs text-red-300">Something went wrong. Try again.</p>
        )}
      </div>
    );
  }

  return null;
}
