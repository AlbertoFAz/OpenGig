import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, Ticket, Pencil } from "lucide-react";

import { getConcertById } from "@/lib/repositories/concerts";
import { isConcertInCalendar } from "@/lib/repositories/calendar-entries";
import { getConcertArtists } from "@/lib/repositories/profiles";
import { hasLiked } from "@/lib/repositories/likes";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConcertButton } from "@/components/concert/DeleteConcertButton";
import { SaveToCalendarButton } from "@/components/concert/SaveToCalendarButton";
import { LikeButton } from "@/components/concert/LikeButton";

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

  // Contar cuántos usuarios han guardado este concierto
  const { data: savedCountData } = await supabase.rpc("get_concert_saved_count", {
    p_concert_id: concert.id,
  });
  const savedCount = (savedCountData as number | null) ?? 0;

  // Comprobar si el usuario autenticado ya lo tiene guardado / le ha dado like
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
      {concert.image_url && (
        <div className="relative mb-6 h-64 w-full overflow-hidden rounded-xl">
          <Image
            src={concert.image_url}
            alt={concert.name}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="mb-2 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold leading-tight">{concert.name}</h1>
        {isPast && (
          <Badge variant="secondary" className="shrink-0">
            Pasado
          </Badge>
        )}
      </div>

      {concert.profiles && (
        <p className="text-muted-foreground mb-6 text-sm">
          Publicado por{" "}
          <Link href={`/profile/${concert.profiles.username}`} className="hover:underline">
            {concert.profiles.display_name ?? concert.profiles.username}
          </Link>
        </p>
      )}

      <dl className="mb-6 grid gap-3 text-sm">
        <div className="flex items-start gap-2">
          <CalendarDays size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <span className="capitalize">{dateLabel}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <span>
            {concert.venue_name}
            {concert.venue_address && ` · ${concert.venue_address}`}
          </span>
        </div>
        {concert.price !== null && (
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-muted-foreground shrink-0" />
            <span className="font-medium">
              {Number(concert.price) === 0 ? "Gratuito" : `${Number(concert.price).toFixed(2)} €`}
            </span>
          </div>
        )}
      </dl>

      {/* Artistas */}
      {artists.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">Artistas</h2>
          <div className="flex flex-wrap gap-2">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/profile/${artist.username}`}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors"
              >
                {artist.display_name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {concert.description && (
        <p className="mb-6 whitespace-pre-line leading-relaxed">{concert.description}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {concert.ticket_url && (
          <Button asChild>
            <a href={concert.ticket_url} target="_blank" rel="noreferrer">
              <Ticket size={16} className="mr-2" />
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

        {/* Botón guardar/quitar del calendario privado — para cualquier usuario autenticado */}
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
                <Pencil size={16} className="mr-2" />
                Editar
              </Link>
            </Button>
            <DeleteConcertButton concertId={concert.id} />
          </>
        )}
        <Button variant="ghost" asChild>
          <Link href="/">← Volver al calendario</Link>
        </Button>
      </div>
    </div>
  );
}
