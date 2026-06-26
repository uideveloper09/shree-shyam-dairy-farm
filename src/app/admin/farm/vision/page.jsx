"use client";

import { useQuery } from "@tanstack/react-query";

export default function VisionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["vision"],
    queryFn: () => fetch("/api/v1/vision/ingest").then((r) => r.json()),
  });

  return (
    <div>
      <h2 className="font-heading text-xl font-bold">AI Computer Vision</h2>
      <p className="mt-2 text-sm text-white/60">
        Cow ID, BCS, lameness, counting, intruder — edge YOLO/OpenCV/MediaPipe
      </p>
      {isLoading ? (
        <p className="mt-4 text-white/50">Loading…</p>
      ) : (
        <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-green-300">
          {JSON.stringify(data?.detections?.slice(0, 15), null, 2)}
        </pre>
      )}
    </div>
  );
}
