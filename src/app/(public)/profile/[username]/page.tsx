import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MapPin, Users, Music2, ExternalLink } from "lucide-react";

import { getProfileByUsername } from "@/lib/repositories/profiles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/schemas/profile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return { title: `${username} — OpenGig` };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const result = await getProfileByUsername(username);
  if (!result.ok) notFound();

  const profile = result.data;
  const socialLinks = (profile.social_links ?? {}) as Record<string, string>;
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  const concerts = profile.concerts ?? [];
  const upcomingConcerts = concerts
    .filter((c) => new Date(c.date_time) >= new Date())
    .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  const pastConcerts = concerts
    .filter((c) => new Date(c.date_time) < new Date())
    .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());

  // Para artistas: obtener conciertos en los que participa (no solo los que publica)
  // (los conciertos propios ya están en profile.concerts)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Cabecera del perfil */}
      <div className="mb-8 flex items-start gap-5">
        {profile.image_url ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full">
            <Image
              src={profile.image_url}
              alt={profile.display_name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-muted text-muted-foreground flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">@{profile.username}</p>

          <p className="mt-1 text-sm">
            <span className="font-medium">Prestigio:</span> {profile.prestige}
          </p>

          {profile.biography && <p className="mt-3 text-sm leading-relaxed">{profile.biography}</p>}

          {/* Dirección — solo VENUE */}
          {profile.role === "VENUE" && profile.venue_address && (
            <p className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4 shrink-0" />
              <a
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(profile.venue_address)}`}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {profile.venue_address}
              </a>
              {profile.venue_capacity && (
                <span className="ml-2 flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {profile.venue_capacity.toLocaleString("es-ES")} aforo
                </span>
              )}
            </p>
          )}

          {/* Ámbito — solo COLLABORATOR */}
          {profile.role === "COLLABORATOR" && profile.collaborator_scope && (
            <p className="text-muted-foreground mt-2 text-sm">{profile.collaborator_scope}</p>
          )}

          {/* Redes sociales — solo ARTIST */}
          {profile.role === "ARTIST" && hasSocialLinks && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(socialLinks).map(
                ([key, url]) =>
                  url && (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm hover:underline capitalize"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {key}
                    </a>
                  )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conciertos próximos */}
      {upcomingConcerts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Music2 className="h-5 w-5" /> Próximos conciertos
          </h2>
          <div className="grid gap-3">
            {upcomingConcerts.map((concert) => (
              <ConcertRow key={concert.id} concert={concert} />
            ))}
          </div>
        </section>
      )}

      {/* Conciertos pasados */}
      {pastConcerts.length > 0 && (
        <section>
          <h2 className="text-muted-foreground mb-4 text-lg font-semibold">Conciertos pasados</h2>
          <div className="grid gap-3">
            {pastConcerts.slice(0, 10).map((concert) => (
              <ConcertRow key={concert.id} concert={concert} past />
            ))}
          </div>
        </section>
      )}

      {concerts.length === 0 && (
        <p className="text-muted-foreground text-sm">Todavía no hay conciertos publicados.</p>
      )}
    </div>
  );
}

function ConcertRow({
  concert,
  past = false,
}: {
  concert: {
    id: string;
    name: string;
    date_time: string;
    venue_name: string;
    image_url: string | null;
  };
  past?: boolean;
}) {
  return (
    <Card className={past ? "opacity-70" : ""}>
      <CardContent className="flex items-center gap-3 p-3">
        {concert.image_url && (
          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded">
            <Image src={concert.image_url} alt={concert.name} fill className="object-cover" />
          </div>
        )}
        <div className="min-w-0">
          <Link href={`/concerts/${concert.id}`} className="font-medium hover:underline">
            {concert.name}
          </Link>
          <p className="text-muted-foreground text-xs">
            {format(new Date(concert.date_time), "d MMM yyyy · HH:mm", { locale: es })}
            {" · "}
            {concert.venue_name}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
