"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/errors/ErrorFallback";
import { errorLogger } from "@/lib/logging/client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    errorLogger.unhandled(error, {
      source: "next_error_page",
      digest: error.digest,
    });
  }, [error]);

  return <ErrorFallback error={error} reset={reset} statusCode={500} />;
}
