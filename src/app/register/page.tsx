import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Sign up — OpenGig" };

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <RegisterForm />
      </Card>
    </div>
  );
}
