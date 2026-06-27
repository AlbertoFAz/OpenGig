import { z } from "zod";

export const ROLE_OPTIONS = ["USER", "ARTIST", "VENUE", "COLLABORATOR", "ADMIN"] as const;
export type UserRole = (typeof ROLE_OPTIONS)[number];

// Roles que el usuario puede elegir al registrarse.
// COLLABORATOR se obtiene por condiciones específicas, no en el registro.
// ADMIN se asigna manualmente desde la base de datos.
export const REGISTERABLE_ROLES = ["USER", "ARTIST", "VENUE"] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Aficionado",
  ARTIST: "Artista",
  VENUE: "Sala / Recinto",
  COLLABORATOR: "Colaborador",
  ADMIN: "Administrador",
};

/** Color del borde de tarjeta y acento de calendairo según el rol del creador */
export const ROLE_COLORS: Record<UserRole, string> = {
  USER: "oklch(0.6 0.15 240)", // azul
  ARTIST: "oklch(0.65 0.16 35)", // ámbar/naranja
  VENUE: "oklch(0.58 0.18 300)", // violeta
  COLLABORATOR: "oklch(0.6 0.17 145)", // verde
  ADMIN: "oklch(0.58 0.22 15)", // rojo
};

export const ROLE_DESCRIPTIONS: Record<RegisterableRole, string> = {
  USER: "Sigo conciertos y guardo eventos en mi calendario personal.",
  ARTIST: "Soy músico o grupo y quiero publicar mis conciertos.",
  VENUE: "Gestiono una sala o recinto y publico los eventos que acojo.",
};

export const profileSchema = z.object({
  display_name: z.string().min(1, "El nombre es obligatorio.").max(80),
  biography: z.string().max(1000, "La biografía no puede superar los 1000 caracteres.").optional(),
  social_links: z
    .object({
      spotify: z.string().url("URL inválida.").optional().or(z.literal("")),
      bandcamp: z.string().url("URL inválida.").optional().or(z.literal("")),
      youtube: z.string().url("URL inválida.").optional().or(z.literal("")),
      instagram: z.string().url("URL inválida.").optional().or(z.literal("")),
      website: z.string().url("URL inválida.").optional().or(z.literal("")),
    })
    .optional(),
  // Campos específicos de VENUE
  venue_address: z.string().max(200).optional(),
  venue_capacity: z
    .number()
    .int("Debe ser un número entero.")
    .min(1, "La capacidad debe ser mayor que 0.")
    .optional(),
  // Campos específicos de COLLABORATOR
  collaborator_scope: z.string().max(200).optional(),
  // Imagen de perfil (solo en cliente)
  image: z
    .instanceof(typeof window !== "undefined" ? File : (Object as unknown as typeof File))
    .optional()
    .refine((f) => !f || f.size <= 5 * 1024 * 1024, "La imagen no puede superar los 5 MB.")
    .refine(
      (f) => !f || ["image/jpeg", "image/png", "image/webp"].includes(f.type),
      "Solo se permiten imágenes JPG, PNG o WebP."
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const registerRoleSchema = z.object({
  role: z.enum(REGISTERABLE_ROLES, { message: "Elige un rol para continuar." }),
});
export type RegisterRoleInput = z.infer<typeof registerRoleSchema>;
