import { Suspense } from "react";
import MobileSettingsContent from "./SettingsContent";

export default function MobileSettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Loading settings…</p>}>
      <MobileSettingsContent />
    </Suspense>
  );
}
