import { z } from "zod";

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
