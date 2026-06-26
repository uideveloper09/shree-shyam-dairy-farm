import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";

export default async function CrmAdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/crm");
  if (!hasPermission(user.role, "admin:crm:read")) redirect("/account");

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#082F63]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C89B3C]">Sales & Support</p>
            <h1 className="font-heading text-lg font-bold">CRM Admin</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <Link href="/admin/integrations" className="hover:text-white">
              Integrations
            </Link>
            <Link href="/account" className="hover:text-white">
              Account
            </Link>
            <span>{user.name || user.email}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
