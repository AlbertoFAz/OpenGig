import { z } from "zod";
import { es } from "@/i18n/es";

const v = es.validation;

export const loginSchema = z.object({
  email: z.string().min(1, v.emailRequired).email(v.emailInvalid),
  password: z.string().min(1, v.passwordRequired),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, v.emailRequired).email(v.emailInvalid),
    password: z.string().min(8, v.passwordMinLength),
    confirmPassword: z.string().min(1, v.passwordRequired),
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
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
