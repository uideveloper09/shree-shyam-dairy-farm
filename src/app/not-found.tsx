import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-heading text-sm font-semibold tracking-widest text-[#082F63]/70 uppercase">
        Error 404
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-[#082F63] sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-premium-navy mt-8 h-11 px-8">
        Back to home
      </Link>
    </main>
  );
}
