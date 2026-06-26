import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Heart,
  MapPin,
  Package,
  Repeat,
  Bell,
  Ticket,
  Wallet,
  HelpCircle,
  User,
  CreditCard,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import BrandLogo from "@/components/ui/BrandLogo";
import LogoutButton from "@/components/account/LogoutButton";

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: User },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/subscriptions", label: "Milk Subscription", icon: Repeat },
  { href: "/account/addresses", label: "Saved Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/payments", label: "Payment Methods", icon: CreditCard },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/coupons", label: "Coupons", icon: Ticket },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/help", label: "Help Center", icon: HelpCircle },
];

export default async function AccountLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/account");

  return (
    <div className="min-h-[100dvh] bg-[#f8f6f1]">
      <header className="border-b border-[#e8e4dc] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/">
            <BrandLogo compact />
          </Link>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#082F63]">{user.name || "My Account"}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#e8e4dc] bg-white p-3 shadow-sm">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C89B3C]">
            My Account
          </p>
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#082F63]/80 transition hover:bg-[#f8f6f1] hover:text-[#082F63]"
              >
                <Icon size={16} className="text-[#C89B3C]" />
                {label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </aside>

        <main className="min-w-0 rounded-2xl border border-[#e8e4dc] bg-white p-5 shadow-sm sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
