import { z } from "zod";

export const ROLE_OPTIONS = ["USER", "ARTIST", "VENUE", "COLLABORATOR"] as const;
export type UserRole = (typeof ROLE_OPTIONS)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  USER: "Aficionado",
  ARTIST: "Artista",
  VENUE: "Sala / Recinto",
  COLLABORATOR: "Colaborador",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  USER: "Sigo conciertos y guardo eventos en mi calendario personal.",
  ARTIST: "Soy músico o grupo y quiero publicar mis conciertos.",
  VENUE: "Gestiono una sala o recinto y publico los eventos que acojo.",
  COLLABORATOR: "Colaboro con artistas o salas en la organización de eventos.",
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
  role: z.enum(ROLE_OPTIONS, { message: "Elige un rol para continuar." }),
});
export type RegisterRoleInput = z.infer<typeof registerRoleSchema>;
