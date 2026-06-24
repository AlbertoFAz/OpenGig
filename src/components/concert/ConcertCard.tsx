"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { Heart, MapPin, Music2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Concert } from "@/lib/repositories/concerts";

interface ConcertCardProps {
  concert: Concert;
}

export function ConcertCard({ concert }: ConcertCardProps) {
  const { t, locale } = useLocale();
  const dateFnsLocale = locale === "en" ? enUS : es;
  const date = new Date(concert.date_time);
  const day = format(date, "d");
  const month = format(date, "MMM", { locale: dateFnsLocale }).toUpperCase();
  const time = format(date, "HH:mm");
  const isPast = date < new Date();

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm",
        "transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl",
        isPast && "opacity-65"
      )}
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
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900">
            <Music2 className="size-14 text-white/15" />
          </div>
        )}

        {/* Degradado inferior para texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Chip de fecha — arriba izquierda */}
        <div className="absolute left-3 top-3 rounded-xl bg-black/50 px-2.5 py-1.5 text-center leading-none backdrop-blur-sm">
          <div className="text-[10px] font-bold tracking-widest text-white/70">{month}</div>
          <div className="text-lg font-bold text-white">{day}</div>
          <div className="text-[10px] text-white/60">{time}</div>
        </div>

        {/* Likes — arriba derecha */}
        {(concert.likes_count ?? 0) > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
            <Heart className="size-3 fill-rose-400 text-rose-400" />
            {concert.likes_count}
          </div>
        )}

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

      {/* Footer: precio + botón tickets (z-20 para quedar sobre el enlace estirado) */}
      <div className="relative z-20 flex items-center justify-between gap-2 px-4 py-3">
        <span className="text-sm font-semibold">
          {concert.price === null || concert.price === undefined ? null : Number(concert.price) ===
            0 ? (
            <span className="text-emerald-600 dark:text-emerald-400">{t.concert.free}</span>
          ) : (
            `${Number(concert.price).toFixed(2)} €`
          )}
        </span>
        {concert.ticket_url && (
          <Button asChild size="sm" variant="outline">
            <a href={concert.ticket_url} target="_blank" rel="noreferrer">
              <Ticket data-icon="inline-start" />
              {t.concert.tickets}
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
