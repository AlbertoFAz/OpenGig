import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Log in — OpenGig" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <LoginForm />
      </Card>
    </div>
  );
}
