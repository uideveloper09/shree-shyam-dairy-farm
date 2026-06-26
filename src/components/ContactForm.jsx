"use client";

import { useState } from "react";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock } from "react-icons/fa";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSiteData } from "@/features/cart/context/SiteDataContext";
import { CONTAINER, SECTION_WHITE, SECTION_HEAD_ALT } from "@/constants/layout";

function ContactInfoPanel({ site, contact, directionsUrl, locationLabel }) {
  const contactItems = [
    {
      icon: FaPhoneAlt,
      label: "Phone",
      value: site.phone,
      href: `tel:${site.phone.replace(/\s/g, "")}`,
    },
    {
      icon: FaEnvelope,
      label: "Email",
      value: site.email,
      href: `mailto:${site.email}`,
    },
  ];

  return (
    <div className="premium-card flex h-full flex-col overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-[#e8e4dc] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {contactItems.map(({ icon: Icon, label, value, href }) => (
          <a
            key={label}
            href={href}
            className="group flex items-start gap-3 p-4 transition hover:bg-[#faf9f7] sm:p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#082F63]/10 to-[#C89B3C]/15 text-[#082F63] ring-1 ring-[#C89B3C]/20 transition group-hover:from-[#082F63]/15 group-hover:to-[#C89B3C]/25">
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C89B3C]">
                {label}
              </p>
              <p className="mt-1 text-[14px] font-semibold leading-snug text-[#082F63] break-words">
                {value}
              </p>
            </div>
          </a>
        ))}
      </div>

      <div className="border-t border-[#e8e4dc] bg-gradient-to-br from-white to-[#faf9f7] p-4 sm:p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C89B3C]">
          Farm Location
        </p>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#082F63]/10 to-[#C89B3C]/15 text-[#082F63] ring-1 ring-[#C89B3C]/20">
            <FaMapMarkerAlt size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-[#082F63]">{locationLabel}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              {contact.address || site.location}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500">
              <span className="font-medium text-gray-700">{site.phone}</span>
              <span className="hidden text-gray-300 sm:inline">|</span>
              <span className="inline-flex items-center gap-1.5">
                <FaClock size={11} className="text-[#C89B3C]" />
                {site.hours}
              </span>
            </div>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#082F63] transition hover:text-[#C89B3C]"
            >
              {contact.directionsLabel || "Get directions"}
              <span aria-hidden className="transition group-hover:translate-x-0.5">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactMessageForm({ site, status, error, onSubmit }) {
  return (
    <div className="premium-card p-5 sm:p-6">
      <div className="mb-4 border-b border-[#e8e4dc] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C89B3C]">
          Send a Message
        </p>
        <p className="mt-1 text-[14px] text-gray-600">We&apos;ll respond as soon as possible.</p>
      </div>

      {status === "done" ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center">
          <div className="mb-3 text-4xl">✓</div>
          <p className="text-[16px] font-semibold text-green-800">Message sent!</p>
          <p className="mt-2 text-[14px] text-green-700">
            We&apos;ll get back to you soon at {site.email}.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              className="w-full rounded-lg border border-[#e8e4dc] bg-[#faf9f7] px-4 py-2.5 text-[14px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]/30"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500"
            >
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-[#e8e4dc] bg-[#faf9f7] px-4 py-2.5 text-[14px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="email"
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500"
            >
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#e8e4dc] bg-[#faf9f7] px-4 py-2.5 text-[14px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="comment"
              className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-gray-500"
            >
              Comment
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              placeholder="How can we help you?"
              className="w-full resize-none rounded-lg border border-[#e8e4dc] bg-[#faf9f7] px-4 py-2.5 text-[14px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]/30"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
              {error}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-premium-navy h-11 w-full disabled:opacity-60 sm:w-auto sm:min-w-[200px]"
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ContactForm() {
  const { site, contact } = useSiteData();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(contact.mapQuery || site.location)}&z=14&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address || contact.mapQuery || site.location)}`;
  const locationLabel = site.location?.split(",")[0]?.trim() || site.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          comment: formData.get("comment"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setStatus("done");
      form.reset();
    } catch (err) {
      setStatus("idle");
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <section id="contact" className={SECTION_WHITE}>
      <div className={CONTAINER}>
        <div className={SECTION_HEAD_ALT}>
          <SectionHeading
            label={contact.label}
            title={contact.title}
            subtitle={contact.subtitle}
            align="left"
            className="mb-0"
          />
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-br from-[#C89B3C]/12 via-transparent to-[#082F63]/8 sm:-inset-3"
            aria-hidden
          />

          <div className="relative space-y-4 sm:space-y-5">
            <div className="grid items-stretch gap-4 sm:gap-5 lg:grid-cols-2">
              <ContactInfoPanel
                site={site}
                contact={contact}
                directionsUrl={directionsUrl}
                locationLabel={locationLabel}
              />

              <div className="relative h-full min-h-[260px] overflow-hidden rounded-2xl shadow-[0_16px_48px_rgba(8,47,99,0.12)] ring-1 ring-[#C89B3C]/25 sm:min-h-[300px]">
                <iframe
                  title={`${site.name} location on Google Maps`}
                  src={mapEmbedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>

            <ContactMessageForm site={site} status={status} error={error} onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </section>
  );
}
