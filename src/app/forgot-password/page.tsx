import { Card } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Recover password — OpenGig" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <ForgotPasswordForm />
      </Card>
    </div>
  );
}
