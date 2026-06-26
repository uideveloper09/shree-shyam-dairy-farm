"use client";

export type ScanResult = { value: string; format: string };

export async function scanBarcode(): Promise<ScanResult | null> {
  if (typeof window === "undefined") return null;

  if ("BarcodeDetector" in window) {
    // @ts-expect-error BarcodeDetector is experimental
    const detector = new BarcodeDetector({
      formats: ["qr_code", "ean_13", "code_128", "code_39"],
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();

    await new Promise((r) => setTimeout(r, 500));

    try {
      const codes = await detector.detect(video);
      stream.getTracks().forEach((t) => t.stop());
      if (codes.length > 0) {
        return { value: codes[0].rawValue, format: codes[0].format };
      }
    } catch {
      stream.getTracks().forEach((t) => t.stop());
    }
  }

  return null;
}

export async function reportScan(value: string, format: string, context: string) {
  const res = await fetch("/api/v1/mobile/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value, format, context }),
  });
  return res.ok;
}

export function getQrUrl(data: string, size = 200): string {
  const params = new URLSearchParams({ data, size: String(size) });
  return `/api/v1/mobile/qr?${params}`;
}
