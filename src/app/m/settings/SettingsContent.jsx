"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { registerPushNotifications, unregisterPushNotifications } from "@/lib/mobile/push";
import {
  registerBiometric,
  loginWithBiometric,
  isBiometricAvailable,
} from "@/lib/mobile/biometric";
import { parseDeepLinkParam } from "@/lib/mobile/apps";

export default function MobileSettingsContent() {
  const [status, setStatus] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ref = parseDeepLinkParam(searchParams.get("ref"));
    if (ref) router.replace(ref);
  }, [searchParams, router]);

  return (
    <div>
      <h1 className="font-heading text-xl font-bold">App Settings</h1>
      <p className="mt-1 text-sm text-white/60">Notifications, biometric & device</p>

      {status && <p className="mt-4 rounded-lg bg-white/10 p-3 text-xs">{status}</p>}

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={async () => {
            const ok = await registerPushNotifications();
            setStatus(ok ? "Push notifications enabled" : "Push not available");
          }}
          className="w-full rounded-xl bg-white/10 py-3 text-sm"
        >
          Enable Push Notifications
        </button>

        <button
          type="button"
          onClick={async () => {
            await unregisterPushNotifications();
            setStatus("Push notifications disabled");
          }}
          className="w-full rounded-xl bg-white/10 py-3 text-sm"
        >
          Disable Push
        </button>

        {isBiometricAvailable() && (
          <>
            <button
              type="button"
              onClick={async () => {
                const ok = await registerBiometric();
                setStatus(ok ? "Biometric login registered" : "Biometric registration failed");
              }}
              className="w-full rounded-xl bg-[#C89B3C] py-3 text-sm font-semibold text-[#082F63]"
            >
              Register Biometric Login
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await loginWithBiometric();
                setStatus(ok ? "Biometric login success" : "Biometric login failed");
                if (ok) router.refresh();
              }}
              className="w-full rounded-xl bg-white/10 py-3 text-sm"
            >
              Test Biometric Login
            </button>
          </>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-white/10 p-4 text-xs text-white/50">
        <p className="font-semibold text-white/80">Deep Links</p>
        <p className="mt-2">
          Scheme: <code className="text-[#C89B3C]">ssd://</code>
        </p>
        <p className="mt-1">Example: ssd://delivery, ssd://customer/orders</p>
      </div>
    </div>
  );
}
