import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";

export default async function ProcessingAdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/processing");
  if (!hasPermission(user.role, "admin:processing:read")) redirect("/account");

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#082F63]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C89B3C]">Dairy Production</p>
            <h1 className="font-heading text-lg font-bold">Milk Processing</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <Link href="/admin/farm" className="hover:text-white">
              Farm
            </Link>
            <Link href="/admin/fleet" className="hover:text-white">
              Fleet
            </Link>
            <span>{user.name || user.email}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
