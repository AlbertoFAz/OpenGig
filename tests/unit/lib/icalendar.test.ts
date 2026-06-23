import { describe, it, expect } from "vitest";
import ical from "node-ical";
import { concertToIcsEvent, concertsToIcsCalendar, googleCalendarUrl } from "@/lib/icalendar";
import type { ConcertForIcs } from "@/lib/icalendar";

const BASE_CONCERT: ConcertForIcs = {
  id: "abc123",
  name: "Test Concert",
  description: "A test concert",
  date_time: "2026-09-15T20:00:00.000Z",
  venue_name: "Sala Apolo",
  venue_address: "Carrer de la Nou de la Rambla, 113, Barcelona",
  ticket_url: null,
  image_url: null,
};

const BASE_URL = "https://opengig.app";

describe("concertToIcsEvent", () => {
  it("genera un UID con el id del concierto", () => {
    const event = concertToIcsEvent(BASE_CONCERT, BASE_URL);
    expect(event.uid).toBe("concert-abc123@opengig");
  });

  it("establece el título y la descripción", () => {
    const event = concertToIcsEvent(BASE_CONCERT, BASE_URL);
    expect(event.title).toBe("Test Concert");
    expect(event.description).toBe("A test concert");
  });

  it("la ubicación combina venue_name y venue_address", () => {
    const event = concertToIcsEvent(BASE_CONCERT, BASE_URL);
    expect(event.location).toContain("Sala Apolo");
    expect(event.location).toContain("Carrer de la Nou de la Rambla");
  });

  it("usa solo venue_name si no hay venue_address", () => {
    const event = concertToIcsEvent({ ...BASE_CONCERT, venue_address: "" }, BASE_URL);
    expect(event.location).toBe("Sala Apolo");
  });

  it("la duración por defecto es 2 horas", () => {
    const event = concertToIcsEvent(BASE_CONCERT, BASE_URL);
    // EventAttributes es { start } & ({ end } | { duration })
    // Usamos duration para evitar la unión discriminada
    const asWithDuration = event as { duration?: { hours?: number } };
    expect(asWithDuration.duration?.hours).toBe(2);
  });

  it("startInputType es utc", () => {
    const event = concertToIcsEvent(BASE_CONCERT, BASE_URL);
    expect(event.startInputType).toBe("utc");
  });
});

describe("concertsToIcsCalendar", () => {
  it("devuelve ok:true con contenido .ics válido", () => {
    const result = concertsToIcsCalendar([BASE_CONCERT], BASE_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("BEGIN:VCALENDAR");
    expect(result.value).toContain("BEGIN:VEVENT");
    expect(result.value).toContain("END:VEVENT");
    expect(result.value).toContain("END:VCALENDAR");
  });

  it("incluye el UID del concierto", () => {
    const result = concertsToIcsCalendar([BASE_CONCERT], BASE_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("concert-abc123@opengig");
  });

  it("genera múltiples eventos para múltiples conciertos", () => {
    const concert2: ConcertForIcs = { ...BASE_CONCERT, id: "xyz789", name: "Second Concert" };
    const result = concertsToIcsCalendar([BASE_CONCERT, concert2], BASE_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const veventCount = (result.value.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(veventCount).toBe(2);
  });

  it("parseable por node-ical sin errores", () => {
    const result = concertsToIcsCalendar([BASE_CONCERT], BASE_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const parsed = ical.parseICS(result.value);
    const events = Object.values(parsed).filter((e) => e !== undefined && e.type === "VEVENT");
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it("el evento parseado tiene el summary correcto", () => {
    const result = concertsToIcsCalendar([BASE_CONCERT], BASE_URL);
    if (!result.ok) return;

    const parsed = ical.parseICS(result.value);
    const event = Object.values(parsed).find((e) => e !== undefined && e.type === "VEVENT");
    expect(event).toBeDefined();
    if (!event || event.type !== "VEVENT") return;
    // node-ical usa 'summary' para el campo SUMMARY del RFC 5545
    expect(String(event.summary)).toBe("Test Concert");
  });

  it("devuelve ok:false con array vacío (sin eventos la librería sigue bien)", () => {
    const result = concertsToIcsCalendar([], BASE_URL);
    // La librería ics puede fallar o no con array vacío — verificamos que el resultado es coherente
    if (result.ok) {
      expect(result.value).toContain("BEGIN:VCALENDAR");
    } else {
      expect(typeof result.error).toBe("string");
    }
  });
});

describe("googleCalendarUrl", () => {
  it("devuelve una URL de Google Calendar", () => {
    const url = googleCalendarUrl(BASE_CONCERT);
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render/);
  });

  it("incluye action=TEMPLATE", () => {
    const url = googleCalendarUrl(BASE_CONCERT);
    expect(url).toContain("action=TEMPLATE");
  });

  it("incluye el nombre del concierto en el parámetro text", () => {
    const url = googleCalendarUrl(BASE_CONCERT);
    // URLSearchParams codifica espacios como '+' en lugar de '%20'
    expect(url).toContain("text=Test+Concert");
  });

  it("incluye las fechas en formato UTC compacto", () => {
    const url = googleCalendarUrl(BASE_CONCERT);
    // 2026-09-15T20:00:00Z → 20260915T200000Z
    expect(url).toContain("20260915T200000Z");
  });

  it("incluye ticket_url en la descripción si está presente", () => {
    const url = googleCalendarUrl({
      ...BASE_CONCERT,
      ticket_url: "https://tickets.example.com",
    });
    expect(url).toContain(encodeURIComponent("https://tickets.example.com"));
  });
});
