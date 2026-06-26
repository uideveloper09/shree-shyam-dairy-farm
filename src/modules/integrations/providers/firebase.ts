import type { IntegrationProviderAdapter } from "@/modules/integrations/types";
import { envStatus, hasEnv } from "@/modules/integrations/providers/_helpers";

export const firebaseAdapter: IntegrationProviderAdapter = {
  id: "FIREBASE",
  name: "Firebase",
  category: "platform",
  description: "FCM push, auth, realtime database",
  isConfigured: () => hasEnv("FIREBASE_PROJECT_ID", "FIREBASE_SERVER_KEY"),
  getStatus: () => envStatus(["FIREBASE_PROJECT_ID", "FIREBASE_SERVER_KEY"], "Firebase configured"),
};

export async function sendFcmNotification(token: string, title: string, body: string) {
  const key = process.env.FIREBASE_SERVER_KEY;
  if (!key) return { sent: false, mock: true };
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: token, notification: { title, body } }),
  });
  return { sent: res.ok, status: res.status };
}
