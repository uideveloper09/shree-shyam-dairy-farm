"use client";

export async function capturePhoto(): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) return null;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });

  const video = document.createElement("video");
  video.srcObject = stream;
  await video.play();

  await new Promise((r) => setTimeout(r, 300));

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx?.drawImage(video, 0, 0);
  stream.getTracks().forEach((t) => t.stop());

  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function uploadProofPhoto(dataUrl: string, context: string): Promise<string | null> {
  const res = await fetch("/api/v1/mobile/camera", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: dataUrl, context }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url: string };
  return data.url;
}
