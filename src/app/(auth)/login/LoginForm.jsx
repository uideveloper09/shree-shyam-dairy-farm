"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { mergeCartAfterLogin } from "@/hooks/useCartSync";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const oauthErrorMessage =
    oauthError === "oauth_failed"
      ? "Google sign-in failed. Please try again or use email."
      : oauthError === "oauth_unavailable"
        ? "Google sign-in is temporarily unavailable."
        : "";
  const error = formError || oauthErrorMessage;

  const handleGoogleLogin = () => {
    const params = new URLSearchParams();
    if (redirect && redirect !== "/account") params.set("redirect", redirect);
    if (remember) params.set("remember", "1");
    const qs = params.toString();
    window.location.href = `/api/v1/auth/oauth/google${qs ? `?${qs}` : ""}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

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
      setFormError(err.message || "Login failed");
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
          <p className="mt-1 text-sm text-gray-500">Sign in to your Kunwar Dairy account</p>
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

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e8e4dc]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e8e4dc] bg-white text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
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
