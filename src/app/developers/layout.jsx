import Link from "next/link";

const NAV = [
  { href: "/developers", label: "Overview" },
  { href: "/developers/docs", label: "API Docs" },
  { href: "/developers/keys", label: "API Keys" },
  { href: "/developers/webhooks", label: "Webhooks" },
];

export default function DevelopersLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-white/10 bg-[#082F63]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C89B3C]">Developer Platform</p>
            <h1 className="font-heading text-lg font-bold">Kunwar Dairy API</h1>
          </div>
          <Link href="/" className="text-xs text-white/60 hover:text-white">
            ← Back to site
          </Link>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
