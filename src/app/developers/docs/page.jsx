"use client";

import { useEffect, useRef } from "react";

export default function ApiDocsPage() {
  const containerRef = useRef < HTMLDivElement > null;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.async = true;
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle global
      window.SwaggerUIBundle({
        url: "/api/public/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          // @ts-expect-error SwaggerUIBundle global
          window.SwaggerUIBundle.presets.apis,
          // @ts-expect-error SwaggerUIBundle global
          window.SwaggerUIBundle.SwaggerUIStandalonePreset,
        ],
        layout: "StandaloneLayout",
      });
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, []);

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">OpenAPI Documentation</h2>
      <p className="mt-2 text-sm text-white/60">
        Interactive Swagger UI — spec at{" "}
        <a href="/api/public/openapi.json" className="text-[#C89B3C]">
          /api/public/openapi.json
        </a>
      </p>

      <div
        id="swagger-ui"
        ref={containerRef}
        className="mt-6 rounded-xl bg-white [&_.swagger-ui]:text-black"
      />

      <div id="sdk" className="mt-12 rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="font-semibold text-[#C89B3C]">TypeScript SDK</h3>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs text-green-300">{`import { ShreeShyamClient } from "@shree-shyam/sdk";

const client = new ShreeShyamClient({
  apiKey: "ssd_live_...",
  baseUrl: "https://your-domain.com",
});

const { data } = await client.products.list();
console.log(data);`}</pre>
        <p className="mt-3 text-xs text-white/50">
          SDK source: <code>sdk/typescript/</code> in the repository.
        </p>
      </div>
    </div>
  );
}
