import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser().catch(() => null);
  redirect(user ? "/society" : "/login");
}
