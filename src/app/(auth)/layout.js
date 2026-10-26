import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }) {
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/society");

  return <>{children}</>;
}
