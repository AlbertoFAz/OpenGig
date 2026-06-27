import { redirect } from "next/navigation";
import { Star, Pencil } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { getMyProfile } from "@/lib/repositories/profiles";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ROLE_LABELS, type UserRole } from "@/lib/schemas/profile";
import { PushSubscriptionButton } from "@/components/notifications/PushSubscriptionButton";

export const metadata = { title: "Mi perfil — OpenGig" };

interface PageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function MyProfilePage({ searchParams }: PageProps) {
  const result = await getMyProfile();
  if (!result.ok) redirect("/login");

  const profile = result.data;
  const { edit } = await searchParams;
  const isEditing = edit === "1";
  const role = profile.role as UserRole;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={profile.image_url ?? undefined} alt={profile.display_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                  {profile.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-xl">{profile.display_name}</CardTitle>
                  <RoleBadge role={role} size={20} />
                </div>
                <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <span>@{profile.username}</span>
                  <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
                  {profile.prestige > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-3 text-amber-500 fill-amber-500" />
                      {profile.prestige}
                    </span>
                  )}
                </CardDescription>
                {profile.status === "PENDING" && (
                  <Badge className="mt-1 bg-amber-500 text-white text-xs">
                    Cuenta pendiente de aprobación por el administrador
                  </Badge>
                )}
              </div>
            </div>

            {!isEditing && (
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link href="/me/profile?edit=1">
                  <Pencil className="size-3.5 mr-1.5" />
                  Editar
                </Link>
              </Button>
            )}
          </div>

          {!isEditing && profile.biography && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {profile.biography}
            </p>
          )}
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">
          {isEditing ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Editar perfil</h3>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/me/profile">Cancelar</Link>
                </Button>
              </div>
              <ProfileForm profile={profile} />
            </>
          ) : (
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full" size="sm">
                <Link href={`/profile/${profile.username}`}>Ver perfil público</Link>
              </Button>
            </div>
          )}
          <Separator />
          <div>
            <h3 className="mb-3 text-sm font-semibold">Notificaciones push</h3>
            <PushSubscriptionButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
