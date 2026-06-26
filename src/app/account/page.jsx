import Link from "next/link";
import { Package, Repeat, MapPin, Heart } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

const QUICK_LINKS = [
  {
    href: "/account/orders",
    label: "Track Orders",
    icon: Package,
    desc: "View current & past orders",
  },
  {
    href: "/account/subscriptions",
    label: "Milk Subscription",
    icon: Repeat,
    desc: "Daily fresh milk delivery",
  },
  {
    href: "/account/addresses",
    label: "Addresses",
    icon: MapPin,
    desc: "Manage delivery locations",
  },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart, desc: "Saved products" },
];

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-[#082F63]">
        Hello, {user?.name?.split(" ")[0] || "there"} 👋
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage orders, subscriptions, and your farm-fresh deliveries.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-[#e8e4dc] p-4 transition hover:border-[#C89B3C]/40 hover:shadow-md"
          >
            <Icon size={20} className="text-[#C89B3C]" />
            <p className="mt-2 font-semibold text-[#082F63] group-hover:text-[#082F63]">{label}</p>
            <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-[#C89B3C]/40 bg-[#C89B3C]/5 p-4">
        <p className="text-sm font-semibold text-[#082F63]">🥛 Subscribe to daily milk</p>
        <p className="mt-1 text-xs text-gray-600">
          Set up daily, alternate-day, or weekly milk delivery — coming in Phase 4.
        </p>
        <Link
          href="/account/subscriptions"
          className="mt-3 inline-block text-sm font-semibold text-[#082F63] underline decoration-[#C89B3C]/60"
        >
          Set up subscription →
        </Link>
      </div>
    </div>
  );
}
