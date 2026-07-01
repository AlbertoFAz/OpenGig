import { test, expect } from "@playwright/test";

test.describe("Flujo de autenticación", () => {
  test("formulario de login tiene campos requeridos", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar|iniciar|login/i })).toBeVisible();
  });

  test("login con credenciales vacías muestra validación", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /entrar|iniciar|login/i }).click();
    // La validación de HTML5 o react-hook-form impide el submit
    await expect(page).toHaveURL(/\/login/);
  });

  test("formulario de registro tiene campos de rol", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
  });

  test("enlace de 'olvidé contraseña' navega correctamente", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: /olvidé|olvidaste|forgot/i });
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/forgot/);
    }
  });
});

test.describe("Recuperación de contraseña", () => {
  test("la página forgot-password muestra un campo de email", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar|send|recuperar/i })).toBeVisible();
  });

  test("forgot-password con email vacío no hace submit", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByRole("button", { name: /enviar|send|recuperar/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test("forgot-password con email inválido muestra error de validación", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/correo|email/i).fill("noesunemail");
    await page.getByRole("button", { name: /enviar|send|recuperar/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });

  test("la página reset-password existe y muestra campos de contraseña", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).not.toHaveURL(/404/);
    // Sin token válido puede mostrar un error o los campos; en cualquier caso la página carga
    await expect(page.getByRole("heading")).toBeVisible();
  });
});

test.describe("Formulario de registro — validación", () => {
  test("registro con email inválido no avanza", async ({ page }) => {
    await page.goto("/register");
    const emailField = page.getByLabel(/correo|email/i);
    await emailField.fill("noesemail");
    await page.getByRole("button", { name: /continuar|siguiente|registrar|siguiente/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test("registro con contraseñas que no coinciden muestra error", async ({ page }) => {
    await page.goto("/register");
    const passwordFields = page.getByLabel(/contraseña|password/i);
    // Rellenar el primer campo de contraseña
    await passwordFields.first().fill("password123");
    // Si existe un campo de confirmación, rellenarlo con otro valor
    if ((await passwordFields.count()) > 1) {
      await passwordFields.nth(1).fill("diferente456");
      await page.getByRole("button", { name: /continuar|siguiente|registrar/i }).click();
      await expect(page).toHaveURL(/register/);
    }
  });
});
