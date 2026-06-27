import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultAppForRole, getAppsForRole } from "@/lib/mobile/apps";
import MobileNav from "@/features/mobile/MobileNav";
import OfflineBanner from "@/features/mobile/OfflineBanner";
import ServiceWorkerRegister from "@/features/mobile/ServiceWorkerRegister";

export const metadata = {
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Kunwar" },
};

export default async function MobileLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/m");

  const apps = getAppsForRole(user.role);
  if (!apps.length) redirect("/account");

  return (
    <div className="min-h-[100dvh] bg-[#0f172a] text-white">
      <ServiceWorkerRegister />
      <OfflineBanner />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#082F63]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#C89B3C]">Mobile App</p>
            <p className="text-sm font-semibold">{user.name || user.email}</p>
          </div>
          <Link href="/" className="text-xs text-white/50 hover:text-white">
            Web →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">{children}</main>
      <MobileNav role={user.role} />
    </div>
  );
}
