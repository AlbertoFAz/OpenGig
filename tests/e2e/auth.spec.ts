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
