"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { mergeCartAfterLogin } from "@/hooks/useCartSync";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      await mergeCartAfterLogin();
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err.message || "Login failed");
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
          <h1 className="mt-6 font-heading text-2xl font-bold text-[#082F63]">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your Shree Shyam account</p>
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

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
              <Lock size={14} /> Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20"
              placeholder="••••••••"
            />
          </label>

          <div className="mb-5 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-gray-300 text-[#082F63]"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#082F63] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-premium-gold flex h-11 w-full items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Sign in
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            New here?{" "}
            <Link href="/signup" className="font-semibold text-[#082F63] hover:underline">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
