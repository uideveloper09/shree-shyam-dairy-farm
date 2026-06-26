import Link from "next/link";

const MODULES = [
  { href: "/admin/farm/iot", title: "IoT Devices", desc: "Sensor ingest, device registry" },
  { href: "/admin/farm/gateway", title: "Edge Gateway", desc: "Node-RED, ESP32, Modbus bridge" },
  { href: "/admin/farm/mqtt", title: "MQTT Layer", desc: "Broker health, offline queue" },
  {
    href: "/admin/farm/autonomy",
    title: "Autonomous Farm",
    desc: "Pumps, fans, generator, emergencies",
  },
  { href: "/admin/farm/weather", title: "Weather Station", desc: "THI, forecasts, feed advisory" },
  { href: "/admin/farm/cctv", title: "Smart CCTV", desc: "Cameras, motion, intruder events" },
  { href: "/admin/farm/vision", title: "AI Vision", desc: "Cow ID, BCS, lameness, counting" },
  { href: "/admin/farm/ai", title: "AI Platform", desc: "Chat, insights, recommendations" },
  { href: "/admin/farm/voice", title: "Voice AI", desc: "Hindi/English voice commands" },
  { href: "/admin/farm/agent", title: "AI Farm Agent", desc: "ERP tools, reports, tasks" },
  { href: "/admin/farm/predictions", title: "Predictions", desc: "Milk, demand, profit forecasts" },
];

export default function FarmHubPage() {
  return (
    <div>
      <h2 className="font-heading text-2xl font-bold text-white">Farm Intelligence Hub</h2>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        IoT → MQTT → Edge Gateway → Autonomy → AI. Storefront, cart, and payments are unchanged.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-[#C89B3C]/50 hover:bg-white/10"
          >
            <h3 className="font-semibold text-[#C89B3C]">{m.title}</h3>
            <p className="mt-1 text-sm text-white/60">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
