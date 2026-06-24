"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { CalendarDays, MapPin, Music2, Pencil, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DeleteConcertButton } from "@/components/concert/DeleteConcertButton";
import { SaveToCalendarButton } from "@/components/concert/SaveToCalendarButton";
import { LikeButton } from "@/components/concert/LikeButton";
import { ExportConcertButtons } from "@/components/concert/ExportConcertButtons";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Concert } from "@/lib/repositories/concerts";

interface Artist {
  id: string;
  username: string;
  display_name: string;
}

interface ConcertDetailContentProps {
  concert: Concert & {
    profiles?: { username: string; display_name: string | null } | null;
  };
  artists: Artist[];
  alreadySaved: boolean;
  alreadyLiked: boolean;
  userId: string | null;
  isOwner: boolean;
  savedCount: number;
}

export function ConcertDetailContent({
  concert,
  artists,
  alreadySaved,
  alreadyLiked,
  userId,
  isOwner,
  savedCount,
}: ConcertDetailContentProps) {
  const { t, locale } = useLocale();
  const dateFnsLocale = locale === "en" ? enUS : es;

  const dateLabel = format(
    new Date(concert.date_time),
    locale === "en" ? "EEEE, MMMM d yyyy 'at' HH:mm" : "EEEE d 'de' MMMM yyyy 'a las' HH:mm",
    { locale: dateFnsLocale }
  );
  const isPast = new Date(concert.date_time) < new Date();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
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

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">{concert.name}</h1>
        {isPast && (
          <Badge variant="secondary" className="mt-1 shrink-0">
            {t.concert.past}
          </Badge>
        )}
      </div>

      {concert.profiles && (
        <p className="mb-6 text-sm text-muted-foreground">
          {t.concert.publishedBy}{" "}
          <Link
            href={`/profile/${concert.profiles.username}`}
            className="font-medium hover:underline"
          >
            {concert.profiles.display_name ?? concert.profiles.username}
          </Link>
        </p>
      )}

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
              {Number(concert.price) === 0
                ? t.concert.free
                : `${Number(concert.price).toFixed(2)} €`}
            </span>
          </div>
        )}
      </dl>

      {artists.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t.concert.artistsLabel}
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

      {concert.description && (
        <p className="mb-8 whitespace-pre-line leading-relaxed text-muted-foreground">
          {concert.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {concert.ticket_url && (
          <Button asChild>
            <a href={concert.ticket_url} target="_blank" rel="noreferrer">
              <Ticket data-icon="inline-start" />
              {t.concert.buyTickets}
            </a>
          </Button>
        )}

        <LikeButton
          concertId={concert.id}
          initialLiked={alreadyLiked}
          initialCount={concert.likes_count}
          userId={userId}
        />

        {userId && (
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
                {t.common.edit}
              </Link>
            </Button>
            <DeleteConcertButton concertId={concert.id} />
          </>
        )}
        <Button variant="ghost" asChild>
          <Link href="/">← {t.common.back}</Link>
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
