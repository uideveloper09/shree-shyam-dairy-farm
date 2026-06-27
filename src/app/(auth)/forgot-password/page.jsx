"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send reset link");

      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#f8f6f1] to-white px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <BrandLogo compact />
          </Link>
          <h1 className="mt-6 font-heading text-2xl font-bold text-[#082F63]">Forgot password?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-[0_12px_40px_rgba(8,47,99,0.08)]">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <p className="mt-4 text-sm font-semibold text-[#082F63]">Check your email</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                If an account exists for <strong>{email}</strong>, a password reset link has been
                sent.
              </p>
              <Link
                href="/login"
                className="btn-premium-gold mt-6 inline-flex h-11 items-center justify-center px-6 text-sm"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <label className="mb-5 block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
                  <Mail size={14} /> Email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20"
                  placeholder="you@example.com"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="btn-premium-gold flex h-11 w-full items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Send reset link
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm font-medium text-[#082F63] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
