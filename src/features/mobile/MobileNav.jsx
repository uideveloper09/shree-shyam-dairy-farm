"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Truck, Tractor, Stethoscope, Crown, Settings } from "lucide-react";

const NAV = [
  { href: "/m/customer", label: "Customer", icon: Home, roles: ["CUSTOMER", "ADMIN", "OWNER"] },
  { href: "/m/delivery", label: "Delivery", icon: Truck, roles: ["DELIVERY", "ADMIN", "OWNER"] },
  {
    href: "/m/farm",
    label: "Farm",
    icon: Tractor,
    roles: ["FARM_MANAGER", "IOT_OPERATOR", "ADMIN", "OWNER"],
  },
  { href: "/m/vet", label: "Vet", icon: Stethoscope, roles: ["VETERINARIAN", "ADMIN", "OWNER"] },
  { href: "/m/owner", label: "Owner", icon: Crown, roles: ["OWNER", "ADMIN"] },
];

export default function MobileNav({ role }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#082F63]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${
                active ? "text-[#C89B3C]" : "text-white/60"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/m/settings"
          className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] ${
            pathname === "/m/settings" ? "text-[#C89B3C]" : "text-white/60"
          }`}
        >
          <Settings size={20} />
          Settings
        </Link>
      </div>
    </nav>
  );
}
