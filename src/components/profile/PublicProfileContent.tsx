"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { MapPin, Users, Music2, ExternalLink, Star, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { type UserRole } from "@/lib/schemas/profile";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { ProfileWithConcerts } from "@/lib/repositories/profiles";

interface Concert {
  id: string;
  name: string;
  date_time: string;
  venue_name: string;
  image_url: string | null;
}

interface PublicProfileContentProps {
  profile: ProfileWithConcerts;
  isOwner?: boolean;
}

export function PublicProfileContent({ profile, isOwner = false }: PublicProfileContentProps) {
  const { t, locale } = useLocale();
  const dateFnsLocale = locale === "en" ? enUS : es;
  const socialLinks = (profile.social_links as Record<string, string> | null) ?? {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  const concerts = profile.concerts ?? [];
  const upcomingConcerts = concerts
    .filter((c) => new Date(c.date_time) >= new Date())
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  const pastConcerts = concerts
    .filter((c) => new Date(c.date_time) < new Date())
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start gap-6">
        <Avatar className="size-24 shrink-0 text-2xl">
          <AvatarImage src={profile.image_url ?? undefined} alt={profile.display_name} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {profile.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{profile.display_name}</h1>
              <RoleBadge role={profile.role as UserRole} size={22} />
              <RoleBadge
                role={profile.role as UserRole}
                variant="label"
                size={60}
                className="opacity-80"
              />
            </div>
            {isOwner && (
              <Button asChild size="sm" variant="outline">
                <Link href="/me/profile">
                  <Pencil className="size-3.5 mr-1.5" />
                  Editar perfil
                </Link>
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">@{profile.username}</p>
          {profile.status === "PENDING" && (
            <Badge className="mt-1 bg-amber-500 text-white">Pendiente de aprobación</Badge>
          )}
          {profile.status === "BLOCKED" && (
            <Badge variant="destructive" className="mt-1">
              Cuenta bloqueada
            </Badge>
          )}

          {profile.prestige > 0 && (
            <p className="mt-1 flex items-center gap-1 text-sm">
              <Star className="size-3.5 text-amber-500 fill-amber-500" />
              <span className="font-medium">{profile.prestige}</span>
              <span className="text-muted-foreground">{t.profilePage.prestige}</span>
            </p>
          )}

          {profile.biography && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {profile.biography}
            </p>
          )}

          {profile.role === "VENUE" && profile.venue_address && (
            <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                <a
                  href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(profile.venue_address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline"
                >
                  {profile.venue_address}
                </a>
              </span>
              {profile.venue_capacity && (
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  {profile.venue_capacity.toLocaleString(locale === "en" ? "en-US" : "es-ES")}{" "}
                  {t.profilePage.capacity}
                </span>
              )}
            </p>
          )}

          {profile.role === "COLLABORATOR" && profile.collaborator_scope && (
            <p className="mt-2 text-sm text-muted-foreground">{profile.collaborator_scope}</p>
          )}

          {profile.role === "ARTIST" && hasSocialLinks && (
            <div className="mt-3 flex flex-wrap gap-3">
              {Object.entries(socialLinks).map(
                ([key, url]) =>
                  url && (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm capitalize text-muted-foreground hover:text-foreground hover:underline transition-colors"
                    >
                      <ExternalLink className="size-3.5" />
                      {key}
                    </a>
                  )
              )}
            </div>
          )}
        </div>
      </div>

      <Separator className="mb-8" />

      {upcomingConcerts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Music2 className="size-5" />
            {t.profilePage.upcomingConcerts}
          </h2>
          <div className="grid gap-3">
            {upcomingConcerts.map((concert) => (
              <ConcertRow key={concert.id} concert={concert} dateFnsLocale={dateFnsLocale} />
            ))}
          </div>
        </section>
      )}

      {pastConcerts.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
            {t.profilePage.pastConcerts}
          </h2>
          <div className="grid gap-3">
            {pastConcerts.slice(0, 10).map((concert) => (
              <ConcertRow key={concert.id} concert={concert} past dateFnsLocale={dateFnsLocale} />
            ))}
          </div>
        </section>
      )}

      {concerts.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Music2 className="size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">{t.profilePage.noConcerts}</p>
        </div>
      )}
    </div>
  );
}

function ConcertRow({
  concert,
  past = false,
  dateFnsLocale,
}: {
  concert: Concert;
  past?: boolean;
  dateFnsLocale: typeof es;
}) {
  return (
    <Card className={past ? "opacity-60" : "transition-shadow hover:shadow-sm"}>
      <CardContent className="flex items-center gap-4 p-3">
        {concert.image_url ? (
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md">
            <Image src={concert.image_url} alt={concert.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="from-muted to-muted/50 flex size-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br">
            <Music2 className="size-5 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0">
          <Link
            href={`/concerts/${concert.id}`}
            className="font-medium hover:underline line-clamp-1"
          >
            {concert.name}
          </Link>
          <p className="text-muted-foreground text-xs mt-0.5">
            {format(new Date(concert.date_time), "d MMM yyyy · HH:mm", {
              locale: dateFnsLocale,
            })}
            {" · "}
            {concert.venue_name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
