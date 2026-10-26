import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { publicUser } from "@/lib/db/auth-repositories";
import { SessionProvider } from "@/components/auth/SessionProvider";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");

  return (
    <SessionProvider user={publicUser(user)}>
      {children}
    </SessionProvider>
  );
}
