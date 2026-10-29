import AuthPage from "@/components/auth/AuthPage";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
