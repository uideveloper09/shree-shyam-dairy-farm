"use client";

import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaDirections,
} from "react-icons/fa";
import SectionHeading from "@/components/ui/SectionHeading";
import { useSiteData } from "@/context/SiteDataContext";
import { CONTAINER, SECTION_WHITE, SECTION_HEAD_ALT } from "@/lib/layout";

function ContactInfoCard({ icon: Icon, label, children, href }) {
  const inner = (
    <div className="premium-card flex gap-3 p-4 transition hover:border-[#C89B3C]/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#082F63]/8 text-[#082F63] ring-1 ring-[#C89B3C]/20">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <div className="mt-0.5 text-[14px] font-medium text-gray-800 leading-snug">
          {children}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

export default function ContactForm() {
  const { site, contact } = useSiteData();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(contact.mapQuery || site.location)}&z=14&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address || contact.mapQuery || site.location)}`;

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

        <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Google Map */}
          <div className="premium-card flex flex-col overflow-hidden">
            <div className="relative min-h-[280px] flex-1 sm:min-h-[360px] lg:min-h-[480px]">
              <iframe
                title={`${site.name} location on Google Maps`}
                src={mapEmbedUrl}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-white px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2 min-w-0">
                <FaMapMarkerAlt className="mt-0.5 shrink-0 text-[#C89B3C]" size={14} />
                <p className="text-[13px] text-gray-600 leading-snug">
                  {contact.address || site.location}
                </p>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-premium-navy inline-flex shrink-0 items-center gap-2 px-4 py-2 text-[12px]"
              >
                <FaDirections size={13} />
                {contact.directionsLabel || "Get Directions"}
              </a>
            </div>
          </div>

          {/* Form + contact cards */}
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ContactInfoCard
                icon={FaPhoneAlt}
                label="Call Us"
                href={`tel:${site.phone.replace(/\s/g, "")}`}
              >
                {site.phone}
              </ContactInfoCard>
              <ContactInfoCard
                icon={FaEnvelope}
                label="Email"
                href={`mailto:${site.email}`}
              >
                <span className="break-all">{site.email}</span>
              </ContactInfoCard>
              <ContactInfoCard icon={FaClock} label="Hours">
                {site.hours}
              </ContactInfoCard>
              <ContactInfoCard
                icon={FaMapMarkerAlt}
                label="Location"
                href={directionsUrl}
              >
                {site.location}
              </ContactInfoCard>
            </div>

            <div className="premium-card flex flex-1 flex-col p-5 sm:p-6">
              {status === "done" ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-green-200 bg-green-50 px-6 py-12 text-center">
                  <div className="mb-3 text-4xl">✓</div>
                  <p className="text-[16px] font-semibold text-green-800">Message sent!</p>
                  <p className="mt-2 text-[14px] text-green-700">
                    We&apos;ll get back to you soon at {site.email}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-1 flex-col space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-[13px] font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Your name"
                        className="w-full rounded-lg border border-gray-200 bg-[#fafafa] px-4 py-3 text-[15px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1.5 block text-[13px] font-medium text-gray-700"
                      >
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full rounded-lg border border-gray-200 bg-[#fafafa] px-4 py-3 text-[15px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-[13px] font-medium text-gray-700"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-gray-200 bg-[#fafafa] px-4 py-3 text-[15px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]"
                    />
                  </div>

                  <div className="flex-1">
                    <label
                      htmlFor="comment"
                      className="mb-1.5 block text-[13px] font-medium text-gray-700"
                    >
                      Comment
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={4}
                      placeholder="How can we help you?"
                      className="w-full resize-none rounded-lg border border-gray-200 bg-[#fafafa] px-4 py-3 text-[15px] outline-none transition focus:border-[#082F63] focus:bg-white focus:ring-1 focus:ring-[#082F63]"
                    />
                  </div>

                  {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="btn-premium-navy h-12 w-full disabled:opacity-60"
                  >
                    {status === "loading" ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
