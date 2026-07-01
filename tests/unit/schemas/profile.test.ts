import { describe, it, expect } from "vitest";
import { profileSchema, registerRoleSchema } from "@/lib/schemas/profile";

describe("profileSchema", () => {
  it("acepta datos mínimos (solo display_name)", () => {
    const result = profileSchema.safeParse({ display_name: "Juan García" });
    expect(result.success).toBe(true);
  });

  it("acepta todos los campos opcionales válidos", () => {
    const result = profileSchema.safeParse({
      display_name: "Artista Ejemplo",
      biography: "Músico de jazz con 10 años de experiencia.",
      social_links: {
        spotify: "https://open.spotify.com/artist/abc",
        instagram: "https://instagram.com/artista",
        website: "https://artista.com",
        bandcamp: "",
        youtube: "",
      },
      venue_address: "Calle Mayor 1, Madrid",
      venue_capacity: 500,
      collaborator_scope: "Divulgación musical en redes sociales",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza display_name vacío", () => {
    const result = profileSchema.safeParse({ display_name: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("display_name");
  });

  it("rechaza display_name mayor de 80 caracteres", () => {
    const result = profileSchema.safeParse({ display_name: "a".repeat(81) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("display_name");
  });

  it("rechaza biography mayor de 1000 caracteres", () => {
    const result = profileSchema.safeParse({
      display_name: "Juan",
      biography: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("biography");
  });

  it("rechaza URL de red social inválida", () => {
    const result = profileSchema.safeParse({
      display_name: "Juan",
      social_links: { instagram: "no-es-una-url" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta string vacío como red social (campo borrado por el usuario)", () => {
    const result = profileSchema.safeParse({
      display_name: "Juan",
      social_links: { instagram: "", spotify: "" },
    });
    expect(result.success).toBe(true);
  });

  it("rechaza venue_capacity negativo", () => {
    const result = profileSchema.safeParse({
      display_name: "Sala",
      venue_capacity: -1,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("venue_capacity");
  });

  it("rechaza venue_capacity decimal", () => {
    const result = profileSchema.safeParse({
      display_name: "Sala",
      venue_capacity: 150.5,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("venue_capacity");
  });

  it("rechaza venue_address mayor de 200 caracteres", () => {
    const result = profileSchema.safeParse({
      display_name: "Sala",
      venue_address: "a".repeat(201),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("venue_address");
  });

  it("rechaza collaborator_scope mayor de 200 caracteres", () => {
    const result = profileSchema.safeParse({
      display_name: "Colaborador",
      collaborator_scope: "x".repeat(201),
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("collaborator_scope");
  });
});

describe("registerRoleSchema", () => {
  it("acepta USER", () => {
    expect(registerRoleSchema.safeParse({ role: "USER" }).success).toBe(true);
  });

  it("acepta ARTIST", () => {
    expect(registerRoleSchema.safeParse({ role: "ARTIST" }).success).toBe(true);
  });

  it("acepta VENUE", () => {
    expect(registerRoleSchema.safeParse({ role: "VENUE" }).success).toBe(true);
  });

  it("rechaza COLLABORATOR (no disponible en el registro)", () => {
    expect(registerRoleSchema.safeParse({ role: "COLLABORATOR" }).success).toBe(false);
  });

  it("rechaza ADMIN (no disponible en el registro)", () => {
    expect(registerRoleSchema.safeParse({ role: "ADMIN" }).success).toBe(false);
  });

  it("rechaza valor vacío", () => {
    expect(registerRoleSchema.safeParse({ role: "" }).success).toBe(false);
  });
});
