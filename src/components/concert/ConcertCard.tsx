"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { CalendarDays, Heart, MapPin, Music2, Ticket } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const dateLabel = format(new Date(concert.date_time), "EEEE d MMMM yyyy · HH:mm", {
    locale: dateFnsLocale,
  });
  const isPast = new Date(concert.date_time) < new Date();

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden transition-shadow hover:shadow-md",
        isPast && "opacity-60"
      )}
    >
      {concert.image_url ? (
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={concert.image_url}
            alt={concert.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {isPast && <div className="absolute inset-0 bg-background/40" />}
        </div>
      ) : (
        <div className="from-muted to-muted/50 flex h-44 w-full items-center justify-center bg-gradient-to-br">
          <Music2 className="text-muted-foreground/30 size-12" />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">{concert.name}</CardTitle>
          {isPast && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {t.concert.past}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5 pb-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          <span className="capitalize">{dateLabel}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{concert.venue_name}</span>
        </span>
        {concert.price !== null && concert.price !== undefined && (
          <span className="font-medium text-foreground">
            {Number(concert.price) === 0 ? t.concert.free : `${Number(concert.price).toFixed(2)} €`}
          </span>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex items-center gap-2 pt-0">
        {(concert.likes_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="size-3" />
            {concert.likes_count}
          </span>
        )}
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/concerts/${concert.id}`}>{t.concert.viewDetails}</Link>
        </Button>
        {concert.ticket_url && (
          <Button asChild size="sm" className="flex-1">
            <a href={concert.ticket_url} target="_blank" rel="noreferrer">
              <Ticket data-icon="inline-start" />
              {t.concert.tickets}
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
