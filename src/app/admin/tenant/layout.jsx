import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isFarmOperator } from "@/lib/auth/farm-session";

export default async function TenantAdminLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/admin/tenant");
  if (!isFarmOperator(user) && !["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/account");
  }

  return <>{children}</>;
}
