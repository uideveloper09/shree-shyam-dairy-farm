import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isFarmOperator } from "@/lib/auth/farm-session";

const NAV = [
  { href: "/admin/farm", label: "Farm Hub" },
  { href: "/admin/farm/iot", label: "IoT" },
  { href: "/admin/farm/gateway", label: "Edge Gateway" },
  { href: "/admin/farm/mqtt", label: "MQTT" },
  { href: "/admin/farm/autonomy", label: "Autonomous Farm" },
  { href: "/admin/farm/weather", label: "Weather" },
  { href: "/admin/farm/cctv", label: "CCTV" },
  { href: "/admin/farm/vision", label: "AI Vision" },
  { href: "/admin/farm/ai", label: "AI Platform" },
  { href: "/admin/farm/voice", label: "Voice AI" },
  { href: "/admin/farm/agent", label: "Farm Agent" },
  { href: "/admin/farm/predictions", label: "Predictions" },
  { href: "/admin/tenant", label: "Tenant" },
  { href: "/admin/security", label: "Security" },
];

export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/farm");
  if (!isFarmOperator(user)) redirect("/account");

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#082F63]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C89B3C]">
              Shree Shyam Dairy Farm
            </p>
            <h1 className="font-heading text-lg font-bold">Farm ERP Admin</h1>
          </div>
          <p className="text-sm text-white/70">
            {user.name || user.email} · {user.role}
          </p>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
