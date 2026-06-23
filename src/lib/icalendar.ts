import { createEvents, type EventAttributes } from "ics";

export interface ConcertForIcs {
  id: string;
  name: string;
  description: string;
  date_time: string;
  venue_name: string;
  venue_address: string;
  ticket_url: string | null;
  image_url: string | null;
}

/** Convierte un concierto al formato de atributos que espera la librería `ics`. */
export function concertToIcsEvent(concert: ConcertForIcs, baseUrl: string): EventAttributes {
  const start = new Date(concert.date_time);

  const toArray = (d: Date): [number, number, number, number, number] => [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];

  const event: EventAttributes = {
    uid: `concert-${concert.id}@opengig`,
    title: concert.name,
    description: concert.description,
    start: toArray(start),
    startInputType: "utc",
    duration: { hours: 2 },
    location: concert.venue_address
      ? `${concert.venue_name}, ${concert.venue_address}`
      : concert.venue_name,
    url: concert.ticket_url ?? `${baseUrl}/concerts/${concert.id}`,
    productId: "//OpenGig//Calendario de Conciertos//ES",
  };

  return event;
}

/**
 * Genera el contenido completo de un fichero `.ics` a partir de un array de conciertos.
 * Devuelve un `Result` para propagar errores sin excepciones.
 */
export function concertsToIcsCalendar(
  concerts: ConcertForIcs[],
  baseUrl: string
): { ok: true; value: string } | { ok: false; error: string } {
  const events = concerts.map((c) => concertToIcsEvent(c, baseUrl));

  const { error, value } = createEvents(events);
  if (error || !value) {
    return { ok: false, error: error?.message ?? "Error generando .ics" };
  }
  return { ok: true, value };
}

/**
 * Construye la URL template de Google Calendar para abrir un concierto directamente.
 * Formato: https://calendar.google.com/calendar/render?action=TEMPLATE&...
 */
export function googleCalendarUrl(concert: ConcertForIcs): string {
  const start = new Date(concert.date_time);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: concert.name,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: concert.description,
    location: concert.venue_address
      ? `${concert.venue_name}, ${concert.venue_address}`
      : concert.venue_name,
  });

  if (concert.ticket_url) {
    params.set("details", `${concert.description}\n\nEntradas: ${concert.ticket_url}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
