import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-[100dvh] items-center justify-center">Loading...</div>}
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
