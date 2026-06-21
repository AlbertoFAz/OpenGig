import { z } from "zod";

export const VISIBILITY_OPTIONS = ["PUBLIC", "PRIVATE"] as const;
export type ConcertVisibility = (typeof VISIBILITY_OPTIONS)[number];

export const concertSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  description: z
    .string()
    .max(2000, "La descripción no puede superar los 2000 caracteres.")
    .optional(),
  date_time: z
    .string()
    .min(1, "La fecha y hora son obligatorias.")
    .refine((v) => new Date(v) > new Date(), {
      message: "La fecha debe ser futura.",
    }),
  venue_name: z.string().min(1, "El nombre de la sala es obligatorio."),
  venue_address: z.string().optional(),
  ticket_url: z.string().url("La URL de entradas no es válida.").optional().or(z.literal("")),
  price: z.number().min(0, "El precio no puede ser negativo.").optional(),
  visibility: z.enum(VISIBILITY_OPTIONS),
  image: z
    .instanceof(typeof window !== "undefined" ? File : (Object as unknown as typeof File))
    .optional()
    .refine((f) => !f || f.size <= 5 * 1024 * 1024, "La imagen no puede superar los 5 MB.")
    .refine(
      (f) => !f || ["image/jpeg", "image/png", "image/webp"].includes(f.type),
      "Solo se permiten imágenes JPG, PNG o WebP."
    ),
});

export type ConcertInput = z.infer<typeof concertSchema>;

export const concertServerSchema = concertSchema.omit({ image: true }).extend({
  image_url: z.string().url().optional(),
});

export type ConcertServerInput = z.infer<typeof concertServerSchema>;

// Schema para entradas personales del calendario privado
export const personalEntrySchema = z.object({
  title: z.string().min(1, "El título es obligatorio.").max(100),
  description: z.string().max(2000).optional(),
  date_time: z
    .string()
    .min(1, "La fecha y hora son obligatorias.")
    .refine((v) => !isNaN(Date.parse(v)), { message: "Fecha no válida." }),
});

export type PersonalEntryInput = z.infer<typeof personalEntrySchema>;
