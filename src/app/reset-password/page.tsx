import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "New password — OpenGig" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
