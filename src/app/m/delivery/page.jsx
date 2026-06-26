"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportGps } from "@/lib/mobile/gps";
import { capturePhoto, uploadProofPhoto } from "@/lib/mobile/camera";
import { scanBarcode, reportScan } from "@/lib/mobile/scanner";
import { queueOfflineAction } from "@/lib/mobile/offline-sync";

export default function DeliveryAppPage() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["mobile-delivery"],
    queryFn: async () => {
      const res = await fetch("/api/v1/mobile/delivery");
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/v1/mobile/delivery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (!navigator.onLine) {
          await queueOfflineAction("delivery.update", payload);
          return { offline: true };
        }
        throw new Error("Update failed");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mobile-delivery"] }),
  });

  async function handleDeliver(assignment) {
    setBusy(true);
    try {
      const pos = await reportGps("delivery", { assignmentId: assignment.id });
      let proofPhotoUrl;
      const photo = await capturePhoto();
      if (photo) proofPhotoUrl = await uploadProofPhoto(photo, "delivery-proof");

      await updateMutation.mutateAsync({
        id: assignment.id,
        status: "delivered",
        latitude: pos.latitude,
        longitude: pos.longitude,
        proofPhotoUrl,
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleScan() {
    const result = await scanBarcode();
    if (result) {
      await reportScan(result.value, result.format, "delivery");
      alert(`Scanned: ${result.value}`);
    } else {
      alert("Scanner not available — enter order number manually");
    }
  }

  if (isLoading) return <p className="text-sm text-white/50">Loading routes…</p>;

  const { assignments = [], stats = {} } = data ?? {};

  return (
    <div>
      <h1 className="font-heading text-xl font-bold">Delivery Boy</h1>
      <p className="mt-1 text-sm text-white/60">GPS tracking & proof of delivery</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-2xl font-bold text-[#C89B3C]">{stats.pending ?? 0}</p>
          <p className="text-white/50">Pending</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-2xl font-bold text-green-400">{stats.delivered ?? 0}</p>
          <p className="text-white/50">Done</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-2xl font-bold">{stats.total ?? 0}</p>
          <p className="text-white/50">Today</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => reportGps("delivery-patrol").catch(() => {})}
          className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-medium"
        >
          Share GPS
        </button>
        <button
          type="button"
          onClick={handleScan}
          className="flex-1 rounded-lg bg-white/10 py-2 text-xs font-medium"
        >
          Scan QR
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {assignments.map((a) => (
          <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-sm text-[#C89B3C]">{a.order?.orderNumber}</p>
            <p className="mt-1 text-xs text-white/60">
              {a.order?.shippingAddress?.line1}, {a.order?.shippingAddress?.city}
            </p>
            <p className="text-xs text-white/40">
              {a.order?.user?.phone || a.order?.guestPhone || a.order?.shippingAddress?.phone}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => updateMutation.mutate({ id: a.id, status: "in_transit" })}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs"
              >
                Start
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDeliver(a)}
                className="rounded-lg bg-[#C89B3C] px-3 py-1.5 text-xs font-semibold text-[#082F63]"
              >
                Delivered
              </button>
            </div>
          </div>
        ))}
        {!assignments.length && (
          <p className="text-center text-sm text-white/40">No pending deliveries</p>
        )}
      </div>
    </div>
  );
}
