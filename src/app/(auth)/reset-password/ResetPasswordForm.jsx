"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verifyToken() {
      setVerifying(true);
      setError("");

      try {
        const res = await fetch(`/api/v1/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.valid) {
          setTokenValid(false);
          setError(data.message || "This reset link is invalid. Request a new one.");
          return;
        }

        setTokenValid(true);
      } catch {
        if (!cancelled) {
          setTokenValid(false);
          setError("Could not verify reset link. Please try again.");
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    void verifyToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token || !tokenValid) {
      setError("Invalid reset link. Request a new one from the forgot password page.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password");

      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
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
          <h1 className="mt-6 font-heading text-2xl font-bold text-[#082F63]">Reset password</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a new password for your account</p>
        </div>

        <div className="rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-[0_12px_40px_rgba(8,47,99,0.08)]">
          {verifying ? (
            <div className="flex flex-col items-center py-6 text-sm text-gray-500">
              <Loader2 size={28} className="mb-3 animate-spin text-[#082F63]" />
              Verifying reset link...
            </div>
          ) : done ? (
            <div className="text-center">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <p className="mt-4 text-sm font-semibold text-[#082F63]">Password updated</p>
              <p className="mt-2 text-sm text-gray-500">Redirecting to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!token && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  This link is missing a token.{" "}
                  <Link href="/forgot-password" className="font-semibold underline">
                    Request a new reset link
                  </Link>
                </div>
              )}

              {token && !tokenValid && !error && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                  <Link href="/forgot-password" className="font-semibold underline">
                    Request a new reset link
                  </Link>
                </div>
              )}

              <label className="mb-4 block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
                  <Lock size={14} /> New password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!tokenValid}
                  className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </label>

              <label className="mb-5 block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#082F63]/70">
                  <Lock size={14} /> Confirm password
                </span>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!tokenValid}
                  className="h-11 w-full rounded-xl border border-[#e8e4dc] px-3 text-sm outline-none transition focus:border-[#C89B3C]/50 focus:ring-2 focus:ring-[#C89B3C]/20 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </label>

              <p className="mb-4 text-[11px] leading-relaxed text-gray-500">
                Min 8 characters with uppercase, lowercase, number, and special character. Link
                expires in 15 minutes.
              </p>

              <button
                type="submit"
                disabled={loading || !tokenValid}
                className="btn-premium-gold flex h-11 w-full items-center justify-center gap-2 text-sm disabled:opacity-60"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Update password
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
