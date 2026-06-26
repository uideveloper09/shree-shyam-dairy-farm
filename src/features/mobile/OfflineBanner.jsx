"use client";

import { useEffect, useState } from "react";
import { registerOfflineSync, syncOfflineQueue } from "@/lib/mobile/offline-sync";

export default function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    registerOfflineSync();

    const onOnline = async () => {
      setOnline(true);
      setSyncing(true);
      await syncOfflineQueue().catch(() => {});
      setSyncing(false);
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && !syncing) return null;

  return (
    <div
      className={`px-4 py-2 text-center text-xs font-medium ${
        online ? "bg-green-600/90 text-white" : "bg-amber-600/90 text-white"
      }`}
    >
      {syncing ? "Syncing offline data…" : "You are offline — changes will sync when connected"}
    </div>
  );
}
