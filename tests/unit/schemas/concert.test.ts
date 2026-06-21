import { describe, it, expect } from "vitest";
import { concertSchema, personalEntrySchema } from "@/lib/schemas/concert";

const VALID_DATE = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16);

describe("concertSchema", () => {
  it("acepta datos válidos completos", () => {
    const result = concertSchema.safeParse({
      name: "Concierto de prueba",
      description: "Descripción del concierto",
      date_time: VALID_DATE,
      venue_name: "Teatro Real",
      venue_address: "Calle Mayor 1",
      ticket_url: "https://entradas.com",
      price: 25.5,
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(true);
  });

  it("acepta datos mínimos sin opcionales", () => {
    const result = concertSchema.safeParse({
      name: "Nombre",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre demasiado corto", () => {
    const result = concertSchema.safeParse({
      name: "AB",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("3 caracteres");
  });

  it("rechaza fecha pasada", () => {
    const pastDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 16);
    const result = concertSchema.safeParse({
      name: "Concierto pasado",
      date_time: pastDate,
      venue_name: "Sala",
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("futura");
  });

  it("rechaza precio negativo", () => {
    const result = concertSchema.safeParse({
      name: "Concierto",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
      price: -5,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("negativo");
  });

  it("rechaza URL de entradas inválida", () => {
    const result = concertSchema.safeParse({
      name: "Concierto",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
      ticket_url: "no-es-url",
    });
    expect(result.success).toBe(false);
  });

  it("acepta ticket_url vacío (campo opcional vacío)", () => {
    const result = concertSchema.safeParse({
      name: "Concierto",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
      ticket_url: "",
    });
    expect(result.success).toBe(true);
  });

  it("acepta precio cero (gratuito)", () => {
    const result = concertSchema.safeParse({
      name: "Concierto gratuito",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
      price: 0,
    });
    expect(result.success).toBe(true);
  });

  it("acepta visibility PUBLIC", () => {
    const result = concertSchema.safeParse({
      name: "Nombre",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.visibility).toBe("PUBLIC");
  });

  it("acepta visibility PRIVATE", () => {
    const result = concertSchema.safeParse({
      name: "Nombre",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "PRIVATE",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.visibility).toBe("PRIVATE");
  });

  it("rechaza cuando falta visibility", () => {
    const result = concertSchema.safeParse({
      name: "Nombre",
      date_time: VALID_DATE,
      venue_name: "Sala",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza visibilidad inválida", () => {
    const result = concertSchema.safeParse({
      name: "Nombre",
      date_time: VALID_DATE,
      venue_name: "Sala",
      visibility: "FRIENDS_ONLY",
    });
    expect(result.success).toBe(false);
  });
});

describe("personalEntrySchema", () => {
  it("acepta datos válidos", () => {
    const result = personalEntrySchema.safeParse({
      title: "Cita con el jazz",
      date_time: new Date(Date.now() + 3600_000).toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("acepta datos completos con descripción", () => {
    const result = personalEntrySchema.safeParse({
      title: "Evento personal",
      description: "Una nota sobre el evento",
      date_time: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rechaza sin título", () => {
    const result = personalEntrySchema.safeParse({
      date_time: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rechaza sin fecha", () => {
    const result = personalEntrySchema.safeParse({ title: "Evento" });
    expect(result.success).toBe(false);
  });

  it("rechaza fecha inválida", () => {
    const result = personalEntrySchema.safeParse({
      title: "Evento",
      date_time: "no-es-una-fecha",
    });
    expect(result.success).toBe(false);
  });
});
