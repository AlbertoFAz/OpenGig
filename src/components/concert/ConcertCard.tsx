import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, Ticket } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Concert } from "@/lib/repositories/concerts";

interface ConcertCardProps {
  concert: Concert;
}

export function ConcertCard({ concert }: ConcertCardProps) {
  const dateLabel = format(new Date(concert.date_time), "EEEE d MMMM yyyy · HH:mm", { locale: es });
  const isPast = new Date(concert.date_time) < new Date();

  return (
    <Card className={`flex flex-col overflow-hidden ${isPast ? "opacity-70" : ""}`}>
      {concert.image_url ? (
        <div className="relative h-40 w-full">
          <Image
            src={concert.image_url}
            alt={concert.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      ) : (
        <div className="bg-muted h-40 w-full" />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base leading-tight">{concert.name}</CardTitle>
          {isPast && <Badge variant="secondary">Pasado</Badge>}
        </div>
      </CardHeader>

      <CardContent className="text-muted-foreground flex flex-col gap-1.5 pb-3 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={14} />
          <span className="capitalize">{dateLabel}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin size={14} />
          <span className="line-clamp-1">{concert.venue_name}</span>
        </span>
        {concert.price !== null && concert.price !== undefined && (
          <span className="font-medium">
            {Number(concert.price) === 0 ? "Gratuito" : `${Number(concert.price).toFixed(2)} €`}
          </span>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex gap-2 pt-0">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href={`/concerts/${concert.id}`}>Ver detalles</Link>
        </Button>
        {concert.ticket_url && (
          <Button asChild size="sm" className="flex-1">
            <a href={concert.ticket_url} target="_blank" rel="noreferrer">
              <Ticket size={14} className="mr-1" />
              Entradas
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
