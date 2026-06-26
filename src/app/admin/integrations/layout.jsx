import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/security/permissions";

export default async function IntegrationsAdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/integrations");
  if (!hasPermission(user.role, "admin:integrations:read")) redirect("/account");

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#082F63]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C89B3C]">Integrations Hub</p>
            <h1 className="font-heading text-lg font-bold">Integrations Admin</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <Link href="/developers" className="hover:text-white">
              REST API
            </Link>
            <Link href="/admin/documents" className="hover:text-white">
              Documents
            </Link>
            <Link href="/admin/crm" className="hover:text-white">
              CRM
            </Link>
            <Link href="/admin/fleet" className="hover:text-white">
              Fleet
            </Link>
            <Link href="/admin/processing" className="hover:text-white">
              Processing
            </Link>
            <Link href="/admin/retail" className="hover:text-white">
              Retail
            </Link>
            <Link href="/admin/ai" className="hover:text-white">
              AI
            </Link>
            <Link href="/admin/saas" className="hover:text-white">
              SaaS
            </Link>
            <span>{user.name || user.email}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
