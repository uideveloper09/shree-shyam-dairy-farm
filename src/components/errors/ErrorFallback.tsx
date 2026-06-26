"use client";

import Link from "next/link";

export type ErrorFallbackProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  statusCode?: number;
  title?: string;
  description?: string;
  showHomeLink?: boolean;
};

export function ErrorFallback({
  error,
  reset,
  statusCode = 500,
  title,
  description,
  showHomeLink = true,
}: ErrorFallbackProps) {
  const heading = title ?? (statusCode === 404 ? "Page not found" : "Something went wrong");
  const body =
    description ??
    (statusCode === 404
      ? "The page you are looking for does not exist or has been moved."
      : "We hit an unexpected error. Please try again.");

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-heading text-sm font-semibold tracking-widest text-[#082F63]/70 uppercase">
        Error {statusCode}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-[#082F63] sm:text-4xl">
        {heading}
      </h1>
      <p className="mt-4 max-w-md text-base text-gray-600">{body}</p>

      {process.env.NODE_ENV !== "production" && error?.message ? (
        <pre className="mt-6 max-w-xl overflow-x-auto rounded-lg bg-gray-100 p-4 text-left text-xs text-gray-800">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {reset ? (
          <button type="button" onClick={reset} className="btn-premium-navy h-11 px-6">
            Try again
          </button>
        ) : null}
        {showHomeLink ? (
          <Link href="/" className="btn-premium-outline h-11 px-6">
            Back to home
          </Link>
        ) : null}
      </div>
    </main>
  );
}
