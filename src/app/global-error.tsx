"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors/ErrorFallback";
import { errorLogger } from "@/lib/logging/client";

/**
 * Root global error boundary — replaces root layout when the root layout errors.
 * Must define its own html/body tags per Next.js requirements.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorLogger.unhandled(error, {
      source: "next_global_error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 min-h-dvh bg-white font-body antialiased text-gray-900">
        <ErrorFallback error={error} reset={reset} statusCode={500} />
      </body>
    </html>
  );
}
