"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import {
  CalendarDays,
  MapPin,
  Music2,
  Pencil,
  Ticket,
  BadgeCheck,
  Mic2,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { DeleteConcertButton } from "@/components/concert/DeleteConcertButton";
import { SaveToCalendarButton } from "@/components/concert/SaveToCalendarButton";
import { LikeButton } from "@/components/concert/LikeButton";
import { ExportConcertButtons } from "@/components/concert/ExportConcertButtons";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Concert } from "@/lib/repositories/concerts";
import type { ConcertArtistEntry } from "@/lib/repositories/profiles";

interface ConcertDetailContentProps {
  concert: Concert & {
    profiles?: { username: string; display_name: string | null; role: string } | null;
  };
  artists: ConcertArtistEntry[];
  alreadySaved: boolean;
  alreadyLiked: boolean;
  userId: string | null;
  isOwner: boolean;
  savedCount: number;
  isLinkedArtist: boolean;
  isVenue: boolean;
}

export function ConcertDetailContent({
  concert,
  artists,
  alreadySaved,
  alreadyLiked,
  userId,
  isOwner,
  savedCount,
  isLinkedArtist,
  isVenue,
}: ConcertDetailContentProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const dateFnsLocale = locale === "en" ? enUS : es;
  const [venueEndorsed, setVenueEndorsed] = useState(!!concert.venue_endorsed_at);
  const [endorsingArtist, setEndorsingArtist] = useState(false);
  const [endorsingVenue, setEndorsingVenue] = useState(false);

  // Saber si el usuario logueado ya avaló como artista
  const myArtistEntry = artists.find((a) => a.kind === "registered" && a.id === userId);
  const [artistEndorsed, setArtistEndorsed] = useState(
    myArtistEntry?.kind === "registered" ? !!myArtistEntry.endorsed_at : false
  );

  const dateLabel = format(
    new Date(concert.date_time),
    locale === "en" ? "EEEE, MMMM d yyyy 'at' HH:mm" : "EEEE d 'de' MMMM yyyy 'a las' HH:mm",
    { locale: dateFnsLocale }
  );
  const isPast = new Date(concert.date_time) < new Date();

  async function handleEndorse(as: "artist" | "venue") {
    if (as === "artist") setEndorsingArtist(true);
    else setEndorsingVenue(true);

    try {
      const res = await fetch(`/api/concerts/${concert.id}/endorse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ as }),
      });
      if (!res.ok) throw new Error();
      if (as === "artist") setArtistEndorsed(true);
      else setVenueEndorsed(true);
      toast.success("Aval registrado");
      router.refresh();
    } catch {
      toast.error("Error al registrar el aval");
    } finally {
      if (as === "artist") setEndorsingArtist(false);
      else setEndorsingVenue(false);
    }
  }

  const endorsedArtistCount = artists.filter(
    (a) => a.kind === "registered" && a.endorsed_at
  ).length;

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
        <div className="flex items-center gap-2 mt-1 shrink-0">
          {isPast && <Badge variant="secondary">{t.concert.past}</Badge>}
          {endorsedArtistCount > 0 && (
            <Badge className="flex items-center gap-1 bg-emerald-600/10 text-emerald-600 border-emerald-600/20">
              <Mic2 className="size-3.5" />
              <span>
                {endorsedArtistCount} {endorsedArtistCount === 1 ? "artista" : "artistas"}
              </span>
            </Badge>
          )}
          {venueEndorsed && (
            <Badge className="flex items-center gap-1 bg-sky-600/10 text-sky-600 border-sky-600/20">
              <Building2 className="size-3.5" />
              <span>Sala</span>
            </Badge>
          )}
        </div>
      </div>

      {concert.profiles && (
        <p className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          {t.concert.publishedBy}{" "}
          <Link
            href={`/profile/${concert.profiles.username}`}
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            <RoleBadge
              role={concert.profiles.role as Parameters<typeof RoleBadge>[0]["role"]}
              size={13}
            />
            {concert.profiles.display_name ?? concert.profiles.username}
          </Link>
        </p>
      )}

      <dl className="mb-6 grid gap-2.5 text-sm">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {/* suppressHydrationWarning: server (UTC) and client (local timezone) format the same UTC timestamp differently */}
          <span className="capitalize" suppressHydrationWarning>
            {dateLabel}
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            {concert.venue_name}
            {venueEndorsed && (
              <BadgeCheck
                className="inline-block ml-1 size-3.5 text-emerald-500"
                aria-label="Sala verificada"
              />
            )}
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
            {artists.map((artist, i) =>
              artist.kind === "registered" ? (
                <Link
                  key={artist.id}
                  href={`/profile/${artist.username}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
                >
                  <RoleBadge role="ARTIST" size={14} />
                  {artist.display_name}
                  {artist.endorsed_at && (
                    <BadgeCheck
                      className="size-3.5 text-emerald-500"
                      aria-label="Artista ha avalado este concierto"
                    />
                  )}
                </Link>
              ) : (
                <span
                  key={`free-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/40 px-3 py-1 text-sm font-medium text-muted-foreground"
                >
                  {artist.name}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {concert.description && (
        <p className="mb-8 whitespace-pre-line leading-relaxed text-muted-foreground">
          {concert.description}
        </p>
      )}

      {/* Botones de aval para artistas/sala vinculados */}
      {(isLinkedArtist || isVenue) && (
        <div className="mb-6 rounded-xl border border-emerald-600/20 bg-emerald-600/5 p-4 space-y-2">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Este concierto te menciona. ¿Quieres avalarlo?
          </p>
          <div className="flex gap-2 flex-wrap">
            {isLinkedArtist && !artistEndorsed && (
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600/10"
                onClick={() => handleEndorse("artist")}
                disabled={endorsingArtist}
              >
                <BadgeCheck className="size-4 mr-1.5" />
                Avalar como artista
              </Button>
            )}
            {isLinkedArtist && artistEndorsed && (
              <Badge className="bg-emerald-600/10 text-emerald-600 border-emerald-600/20">
                <BadgeCheck className="size-3.5 mr-1" /> Avalado como artista
              </Badge>
            )}
            {isVenue && !venueEndorsed && (
              <Button
                size="sm"
                variant="outline"
                className="border-sky-600/30 text-sky-700 dark:text-sky-400 hover:bg-sky-600/10"
                onClick={() => handleEndorse("venue")}
                disabled={endorsingVenue}
              >
                <Building2 className="size-4 mr-1.5" />
                Avalar como sala
              </Button>
            )}
            {isVenue && venueEndorsed && (
              <Badge className="bg-sky-600/10 text-sky-600 border-sky-600/20">
                <Building2 className="size-3.5 mr-1" /> Avalado como sala
              </Badge>
            )}
          </div>
        </div>
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
