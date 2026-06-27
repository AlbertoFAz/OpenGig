import { z } from "zod";
import { es } from "@/i18n/es";
import { REGISTERABLE_ROLES } from "@/lib/schemas/profile";

const v = es.validation;

export const loginSchema = z.object({
  email: z.string().min(1, v.emailRequired).email(v.emailInvalid),
  password: z.string().min(1, v.passwordRequired),
});

export const registerSchema = z
  .object({
    display_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(80),
    email: z.string().min(1, v.emailRequired).email(v.emailInvalid),
    password: z.string().min(8, v.passwordMinLength),
    confirmPassword: z.string().min(1, v.passwordRequired),
    role: z.enum(REGISTERABLE_ROLES, { message: "Elige un rol para continuar." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordMismatch,
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, v.emailRequired).email(v.emailInvalid),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, v.passwordMinLength),
    confirmPassword: z.string().min(1, v.passwordRequired),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: v.passwordMismatch,
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type { UserRole } from "@/lib/schemas/profile";
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
