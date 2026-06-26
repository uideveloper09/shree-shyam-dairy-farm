"use client";

export type GpsPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export function getCurrentPosition(): Promise<GpsPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

export async function reportGps(context: string, metadata?: Record<string, unknown>) {
  const pos = await getCurrentPosition();
  await fetch("/api/v1/mobile/gps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...pos, context, metadata }),
  });
  return pos;
}

export function watchPosition(
  onUpdate: (pos: GpsPosition) => void,
  onError?: (err: GeolocationPositionError) => void
): number {
  return navigator.geolocation.watchPosition(
    (pos) =>
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      }),
    onError,
    { enableHighAccuracy: true, maximumAge: 10000 }
  );
}

export function clearWatch(watchId: number) {
  navigator.geolocation.clearWatch(watchId);
}
