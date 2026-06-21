import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyProfile } from "@/lib/repositories/profiles";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ROLE_LABELS } from "@/lib/schemas/profile";

export const metadata = { title: "Mi perfil — OpenGig" };

export default async function MyProfilePage() {
  const result = await getMyProfile();
  if (!result.ok) redirect("/login");

  const profile = result.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div>
              <CardTitle>Mi perfil</CardTitle>
              <CardDescription className="mt-1">
                <span className="text-muted-foreground text-sm">@{profile.username}</span>
                {" · "}
                <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
