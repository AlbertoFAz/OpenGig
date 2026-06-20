import { describe, it, expect } from "vitest";
import { concertSchema } from "@/lib/schemas/concert";

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
    });
    expect(result.success).toBe(true);
  });

  it("acepta datos mínimos sin opcionales", () => {
    const result = concertSchema.safeParse({
      name: "Nombre",
      date_time: VALID_DATE,
      venue_name: "Sala",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre demasiado corto", () => {
    const result = concertSchema.safeParse({
      name: "AB",
      date_time: VALID_DATE,
      venue_name: "Sala",
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
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("futura");
  });

  it("rechaza precio negativo", () => {
    const result = concertSchema.safeParse({
      name: "Concierto",
      date_time: VALID_DATE,
      venue_name: "Sala",
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
      ticket_url: "no-es-url",
    });
    expect(result.success).toBe(false);
  });

  it("acepta ticket_url vacío (campo opcional vacío)", () => {
    const result = concertSchema.safeParse({
      name: "Concierto",
      date_time: VALID_DATE,
      venue_name: "Sala",
      ticket_url: "",
    });
    expect(result.success).toBe(true);
  });

  it("acepta precio cero (gratuito)", () => {
    const result = concertSchema.safeParse({
      name: "Concierto gratuito",
      date_time: VALID_DATE,
      venue_name: "Sala",
      price: 0,
    });
    expect(result.success).toBe(true);
  });
});
