import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/schemas/auth";

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const result = loginSchema.safeParse({ email: "noesemail", password: "secret123" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("email");
  });

  it("rechaza contraseña vacía", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("password");
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "new@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("acepta datos válidos", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza contraseña menor de 8 caracteres", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("password");
  });

  it("rechaza cuando las contraseñas no coinciden", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toContain("confirmPassword");
  });
});

describe("forgotPasswordSchema", () => {
  it("acepta email válido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("rechaza email inválido", () => {
    expect(forgotPasswordSchema.safeParse({ email: "noemail" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("acepta contraseñas coincidentes y largas", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword",
      confirmPassword: "newpassword",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza cuando no coinciden", () => {
    const result = resetPasswordSchema.safeParse({
      password: "newpassword",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });
});
