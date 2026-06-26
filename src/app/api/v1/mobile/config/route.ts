import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getAppsForRole } from "@/lib/mobile/apps";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  const apps = getAppsForRole(auth.user!.role);

  return NextResponse.json({
    apps,
    features: {
      offlineSync: true,
      pushNotifications: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      biometric: true,
      gps: true,
      camera: true,
      barcode: true,
      qrCode: true,
      deepLinking: true,
    },
    deepLinkScheme: "ssd://",
  });
}
