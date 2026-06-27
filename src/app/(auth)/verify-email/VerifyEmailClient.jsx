"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mail, AlertCircle } from "lucide-react";
import BrandLogo from "@/components/ui/BrandLogo";
import { fetchWithSession, getCsrfTokenFromDocument } from "@/lib/auth/client-fetch";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        const res = await fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.valid) {
          setStatus("success");
          setMessage(data.message || "Email verified!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Could not verify email. Please try again.");
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const resend = async () => {
    setResending(true);
    try {
      const csrf = getCsrfTokenFromDocument();
      const res = await fetchWithSession("/api/v1/auth/verify-email", {
        method: "POST",
        headers: csrf ? { "X-CSRF-Token": csrf } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend");
      setResent(true);
    } catch (err) {
      setMessage(err.message || "Could not resend verification email");
      setStatus("error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-[#f8f6f1] to-white px-4 py-10">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-block">
          <BrandLogo compact />
        </Link>

        <div className="mt-8 rounded-2xl border border-[#e8e4dc] bg-white p-6 shadow-[0_12px_40px_rgba(8,47,99,0.08)]">
          {status === "verifying" && (
            <>
              <Loader2 size={36} className="mx-auto animate-spin text-[#082F63]" />
              <p className="mt-4 text-sm text-gray-600">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <h1 className="mt-4 font-heading text-xl font-bold text-[#082F63]">Email verified</h1>
              <p className="mt-2 text-sm text-gray-500">{message}</p>
              <Link
                href="/account"
                className="btn-premium-gold mt-6 inline-flex h-11 items-center px-6 text-sm"
              >
                Go to account
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle size={40} className="mx-auto text-red-500" />
              <h1 className="mt-4 font-heading text-xl font-bold text-[#082F63]">
                Verification failed
              </h1>
              <p className="mt-2 text-sm text-gray-500">{message}</p>
            </>
          )}

          {(status === "idle" || status === "error") && (
            <>
              <Mail size={36} className="mx-auto text-[#C89B3C]" />
              <h1 className="mt-4 font-heading text-xl font-bold text-[#082F63]">
                Verify your email
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {resent
                  ? "Verification email sent. Check your inbox."
                  : "Click the link in your email, or resend a new one."}
              </p>
              <button
                type="button"
                onClick={resend}
                disabled={resending}
                className="btn-premium-gold mt-6 inline-flex h-11 items-center gap-2 px-6 text-sm disabled:opacity-60"
              >
                {resending ? <Loader2 size={16} className="animate-spin" /> : null}
                Resend verification email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
