import AccountPlaceholder from "@/components/account/AccountPlaceholder";

const pages = [
  ["addresses", "Saved Addresses", "Phase 3"],
  ["wishlist", "Wishlist", "Phase 5"],
  ["payments", "Payment Methods", "Phase 3"],
  ["wallet", "Wallet", "Phase 5"],
  ["coupons", "Coupons", "Phase 5"],
  ["notifications", "Notifications", "Phase 7"],
  ["help", "Help Center", "Phase 7"],
];

export function generateStaticParams() {
  return pages.map(([slug]) => ({ slug }));
}

export default async function AccountSubPage({ params }) {
  const { slug } = await params;
  const match = pages.find(([s]) => s === slug);
  if (!match) return null;
  return <AccountPlaceholder title={match[1]} phase={`${match[1]} — ${match[2]}`} />;
}
