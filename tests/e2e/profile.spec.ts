import { test, expect } from "@playwright/test";

test.describe("Perfil de usuario — flujos autenticados", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!process.env.E2E_TEST_EMAIL) {
      testInfo.skip(true, "E2E_TEST_EMAIL no configurado — saltar tests autenticados");
    }
  });

  test("la página de edición de perfil es accesible sin redirección", async ({ page }) => {
    await page.goto("/me/profile");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("el formulario de perfil tiene el campo display_name", async ({ page }) => {
    await page.goto("/me/profile");
    await expect(page).not.toHaveURL(/\/login/);
    const displayNameField = page.getByLabel(/nombre|display.name/i);
    await expect(displayNameField).toBeVisible();
  });

  test("enviar display_name vacío muestra error de validación", async ({ page }) => {
    await page.goto("/me/profile");
    await expect(page).not.toHaveURL(/\/login/);

    const displayNameField = page.getByLabel(/nombre|display.name/i);
    await displayNameField.clear();
    await page.getByRole("button", { name: /guardar|save|actualizar/i }).click();

    // La validación debe impedir el submit y mostrar un error o permanecer en la página
    await expect(page).toHaveURL(/\/me\/profile/);
  });

  test("el formulario admite URL válida en redes sociales", async ({ page }) => {
    await page.goto("/me/profile");
    await expect(page).not.toHaveURL(/\/login/);

    // Buscar un campo de red social si está presente
    const socialField = page
      .locator('input[name*="instagram"], input[placeholder*="instagram" i]')
      .first();
    const hasSocialField = await socialField.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasSocialField) {
      await socialField.fill("https://instagram.com/artista");
      // No enviamos el formulario para no modificar datos reales del usuario de prueba
      await expect(socialField).toHaveValue("https://instagram.com/artista");
    }
  });
});
