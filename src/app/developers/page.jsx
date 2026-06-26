import Link from "next/link";

export default function DevelopersPage() {
  return (
    <div>
      <h2 className="font-heading text-3xl font-bold">Public REST API</h2>
      <p className="mt-3 max-w-2xl text-white/70">
        Build integrations with Shree Shyam Dairy Farm — product catalog, order tracking, and
        real-time webhooks. Versioned, rate-limited, and documented with OpenAPI.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "REST API v1",
            desc: "Bearer token authentication, JSON responses",
            href: "/developers/docs",
          },
          { title: "API Keys", desc: "Create and manage scoped keys", href: "/developers/keys" },
          {
            title: "Webhooks",
            desc: "Signed event delivery with retries",
            href: "/developers/webhooks",
          },
          {
            title: "TypeScript SDK",
            desc: "Official client library",
            href: "/developers/docs#sdk",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-[#C89B3C]/50"
          >
            <h3 className="font-semibold text-[#C89B3C]">{card.title}</h3>
            <p className="mt-1 text-sm text-white/60">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-white/10 bg-black/30 p-5 font-mono text-xs">
        <p className="text-white/50"># Quick start</p>
        <pre className="mt-2 overflow-x-auto text-green-300">{`curl -H "Authorization: Bearer ssd_live_YOUR_KEY" \\
  https://your-domain.com/api/public/v1/products`}</pre>
      </div>

      <div className="mt-8 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-semibold">Free tier</p>
          <p className="mt-1 text-white/50">60 req/min</p>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-semibold">Pro tier</p>
          <p className="mt-1 text-white/50">300 req/min</p>
        </div>
        <div className="rounded-lg bg-white/5 p-4">
          <p className="font-semibold">Enterprise</p>
          <p className="mt-1 text-white/50">1000 req/min</p>
        </div>
      </div>
    </div>
  );
}
