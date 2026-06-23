import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, Music2, Pencil, Ticket } from "lucide-react";

import { getConcertById } from "@/lib/repositories/concerts";
import { isConcertInCalendar } from "@/lib/repositories/calendar-entries";
import { getConcertArtists } from "@/lib/repositories/profiles";
import { hasLiked } from "@/lib/repositories/likes";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeleteConcertButton } from "@/components/concert/DeleteConcertButton";
import { SaveToCalendarButton } from "@/components/concert/SaveToCalendarButton";
import { LikeButton } from "@/components/concert/LikeButton";
import { ExportConcertButtons } from "@/components/concert/ExportConcertButtons";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConcertDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getConcertById(id);
  if (!result.ok) notFound();

  const concert = result.data;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === concert.created_by;

  const { data: savedCountData } = await supabase.rpc("get_concert_saved_count", {
    p_concert_id: concert.id,
  });
  const savedCount = (savedCountData as number | null) ?? 0;

  const [alreadySaved, artists, alreadyLiked] = await Promise.all([
    user ? isConcertInCalendar(concert.id) : Promise.resolve(false),
    getConcertArtists(id),
    user ? hasLiked(concert.id) : Promise.resolve(false),
  ]);

  const dateLabel = format(new Date(concert.date_time), "EEEE d 'de' MMMM yyyy 'a las' HH:mm", {
    locale: es,
  });
  const isPast = new Date(concert.date_time) < new Date();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Imagen de cabecera */}
      {concert.image_url ? (
        <div className="relative mb-8 h-72 w-full overflow-hidden rounded-2xl shadow-sm">
          <Image
            src={concert.image_url}
            alt={concert.name}
            fill
            className="object-cover"
            priority
          />
          {isPast && <div className="absolute inset-0 bg-background/40" />}
        </div>
      ) : (
        <div className="from-muted to-muted/30 mb-8 flex h-48 w-full items-center justify-center rounded-2xl bg-gradient-to-br">
          <Music2 className="size-16 text-muted-foreground/20" />
        </div>
      )}

      {/* Título y badge */}
      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">{concert.name}</h1>
        {isPast && (
          <Badge variant="secondary" className="mt-1 shrink-0">
            Pasado
          </Badge>
        )}
      </div>

      {concert.profiles && (
        <p className="mb-6 text-sm text-muted-foreground">
          Publicado por{" "}
          <Link
            href={`/profile/${concert.profiles.username}`}
            className="font-medium hover:underline"
          >
            {concert.profiles.display_name ?? concert.profiles.username}
          </Link>
        </p>
      )}

      {/* Metadatos */}
      <dl className="mb-6 grid gap-2.5 text-sm">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="capitalize">{dateLabel}</span>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            {concert.venue_name}
            {concert.venue_address && (
              <span className="text-muted-foreground"> · {concert.venue_address}</span>
            )}
          </span>
        </div>
        {concert.price !== null && (
          <div className="flex items-center gap-2.5">
            <Ticket className="size-4 shrink-0 text-muted-foreground" />
            <span className="font-medium">
              {Number(concert.price) === 0 ? "Gratuito" : `${Number(concert.price).toFixed(2)} €`}
            </span>
          </div>
        )}
      </dl>

      {/* Artistas */}
      {artists.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Artistas
          </p>
          <div className="flex flex-wrap gap-2">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/profile/${artist.username}`}
                className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
              >
                {artist.display_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Descripción */}
      {concert.description && (
        <p className="mb-8 whitespace-pre-line leading-relaxed text-muted-foreground">
          {concert.description}
        </p>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        {concert.ticket_url && (
          <Button asChild>
            <a href={concert.ticket_url} target="_blank" rel="noreferrer">
              <Ticket data-icon="inline-start" />
              Comprar entradas
            </a>
          </Button>
        )}

        <LikeButton
          concertId={concert.id}
          initialLiked={alreadyLiked}
          initialCount={concert.likes_count}
          userId={user?.id ?? null}
        />

        {user && (
          <SaveToCalendarButton
            concertId={concert.id}
            initialSaved={alreadySaved}
            savedCount={savedCount}
          />
        )}

        {isOwner && (
          <>
            <Button variant="outline" asChild>
              <Link href={`/concerts/${concert.id}/edit`}>
                <Pencil data-icon="inline-start" />
                Editar
              </Link>
            </Button>
            <DeleteConcertButton concertId={concert.id} />
          </>
        )}
        <Button variant="ghost" asChild>
          <Link href="/">← Volver</Link>
        </Button>
      </div>

      {concert.visibility === "PUBLIC" && (
        <>
          <Separator className="mt-8" />
          <ExportConcertButtons concert={concert} />
        </>
      )}
    </div>
  );
}
