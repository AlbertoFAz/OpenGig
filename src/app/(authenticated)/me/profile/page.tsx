import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={profile.image_url ?? undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="text-xl">{profile.display_name}</CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                <span>@{profile.username}</span>
                <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
                {profile.prestige > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="size-3 text-amber-500 fill-amber-500" />
                    {profile.prestige}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
