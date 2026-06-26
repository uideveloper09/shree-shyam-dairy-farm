import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultAppForRole } from "@/lib/mobile/apps";

export default async function MobileHubPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/m");

  const app = getDefaultAppForRole(user.role);
  redirect(app?.path || "/account");
}
