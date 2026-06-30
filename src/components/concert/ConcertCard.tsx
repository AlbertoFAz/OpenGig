"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Heart, MapPin, Mic2, Building2, Music2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { cn } from "@/lib/utils";
import { ROLE_COLORS, type UserRole } from "@/lib/schemas/profile";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Concert } from "@/lib/repositories/concerts";

interface ConcertCardProps {
  concert: Concert;
  creator?: {
    display_name: string;
    username: string;
    role: string;
  } | null;
  endorsements?: {
    artistCount: number;
    venueEndorsed: boolean;
  };
  priority?: boolean;
}

export function ConcertCard({
  concert,
  creator,
  endorsements,
  priority = false,
}: ConcertCardProps) {
  const { t, locale } = useLocale();
  const dateFnsLocale = locale === "en" ? enUS : es;
  const date = new Date(concert.date_time);
  const day = format(date, "d");
  const month = format(date, "MMM", { locale: dateFnsLocale }).toUpperCase();
  const time = format(date, "HH:mm");
  const isPast = date < new Date();
  const role = (creator?.role ?? "USER") as UserRole;
  const borderColor = ROLE_COLORS[role];

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-sm",
        "transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl",
        isPast && "opacity-65"
      )}
      style={{ borderColor }}
    >
      {/* Enlace estirado: cubre toda la tarjeta */}
      <Link
        href={`/concerts/${concert.id}`}
        className="absolute inset-0 z-10"
        aria-label={concert.name}
      />

      {/* Zona imagen con overlay */}
      <div className="relative h-52 overflow-hidden">
        {concert.image_url ? (
          <Image
            src={concert.image_url}
            alt={concert.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900">
            <Music2 className="size-14 text-white/15" />
          </div>
        )}

        {/* Degradado inferior para texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Chip de fecha — arriba izquierda */}
        {/* suppressHydrationWarning: server (UTC) vs client (local timezone) format the same UTC timestamp differently */}
        <div
          className="absolute left-3 top-3 rounded-xl bg-black/50 px-2.5 py-1.5 text-center leading-none backdrop-blur-sm"
          suppressHydrationWarning
        >
          <div
            className="text-[10px] font-bold tracking-widest text-white/70"
            suppressHydrationWarning
          >
            {month}
          </div>
          <div className="text-lg font-bold text-white" suppressHydrationWarning>
            {day}
          </div>
          <div className="text-[10px] text-white/60" suppressHydrationWarning>
            {time}
          </div>
        </div>

        {/* Likes — arriba derecha */}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1">
          {(concert.likes_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              <Heart className="size-3 fill-rose-400 text-rose-400" />
              {concert.likes_count}
            </div>
          )}
          {(endorsements?.artistCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs text-emerald-300 backdrop-blur-sm">
              <Mic2 className="size-3" />
              <span>{endorsements!.artistCount}</span>
            </div>
          )}
          {endorsements?.venueEndorsed && (
            <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs text-sky-300 backdrop-blur-sm">
              <Building2 className="size-3" />
            </div>
          )}
        </div>

        {/* Nombre y sala superpuestos al degradado */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-white">
            {concert.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/65">
            <MapPin className="size-3 shrink-0" />
            {concert.venue_name}
          </p>
        </div>
      </div>

      {/* Footer: creador + precio + tickets */}
      <div className="relative z-20 flex items-center justify-between gap-2 px-4 py-3">
        {creator ? (
          <Link
            href={`/profile/${creator.username}`}
            className="relative z-30 flex items-center gap-1.5 min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <RoleBadge role={role} size={16} />
            <span className="truncate text-xs text-muted-foreground hover:text-foreground transition-colors">
              {creator.display_name}
            </span>
          </Link>
        ) : (
          <span className="text-sm font-semibold">
            {concert.price === null || concert.price === undefined ? null : Number(
                concert.price
              ) === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400">{t.concert.free}</span>
            ) : (
              `${Number(concert.price).toFixed(2)} €`
            )}
          </span>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {creator && concert.price !== null && concert.price !== undefined && (
            <span className="text-sm font-semibold">
              {Number(concert.price) === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">{t.concert.free}</span>
              ) : (
                `${Number(concert.price).toFixed(2)} €`
              )}
            </span>
          )}
          {concert.ticket_url && (
            <Button asChild size="sm" variant="outline">
              <a
                href={concert.ticket_url}
                target="_blank"
                rel="noreferrer"
                className="relative z-30"
              >
                <Ticket data-icon="inline-start" />
                {t.concert.tickets}
              </a>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
