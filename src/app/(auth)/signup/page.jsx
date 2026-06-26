"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, Phone, User } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { mergeCartAfterLogin } from "@/hooks/useCartSync";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      await mergeCartAfterLogin();
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err.message || "Signup failed");
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
          <h1 className="mt-6 font-heading text-2xl font-bold text-[#082F63]">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">Join Shree Shyam for fresh dairy delivery</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-[0_12px_40px_rgba(8,47,99,0.08)]"
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
              <User size={14} /> Full name
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
              <Mail size={14} /> Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
              <Phone size={14} /> Mobile (optional)
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20"
              placeholder="10-digit number"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
              <Lock size={14} /> Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-premium-gold flex h-11 w-full items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Create account
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#082F63] hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
