import { test, expect } from "@playwright/test";

test.describe("Calendario público — navegación y vistas", () => {
  test("el calendario carga y muestra un encabezado de mes/semana", async ({ page }) => {
    await page.goto("/");
    // Esperar a que el calendario lazy-loaded se renderice
    await page.waitForSelector(".rbc-toolbar", { timeout: 15_000 });
    await expect(page.locator(".rbc-toolbar")).toBeVisible();
  });

  test("el botón Siguiente avanza al mes siguiente", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".rbc-toolbar", { timeout: 15_000 });

    const label = page.locator(".rbc-toolbar-label");
    const labelBefore = await label.textContent();

    await page.getByRole("button", { name: /siguiente|next/i }).click();
    await page.waitForTimeout(300);

    const labelAfter = await label.textContent();
    expect(labelAfter).not.toBe(labelBefore);
  });

  test("el botón Hoy vuelve al mes actual", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".rbc-toolbar", { timeout: 15_000 });

    const label = page.locator(".rbc-toolbar-label");
    const labelCurrent = await label.textContent();

    // Avanzar dos meses
    await page.getByRole("button", { name: /siguiente|next/i }).click();
    await page.getByRole("button", { name: /siguiente|next/i }).click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /hoy|today/i }).click();
    await page.waitForTimeout(300);

    expect(await label.textContent()).toBe(labelCurrent);
  });

  test("cambiar a vista semana muestra el encabezado de días", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".rbc-toolbar", { timeout: 15_000 });

    await page.getByRole("button", { name: /semana|week/i }).click();
    await page.waitForTimeout(300);

    // En vista semana react-big-calendar muestra cabeceras de día (.rbc-header)
    await expect(page.locator(".rbc-header").first()).toBeVisible();
  });

  test("cambiar a vista día muestra una sola columna de horas", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector(".rbc-toolbar", { timeout: 15_000 });

    await page.getByRole("button", { name: /día|day/i }).click();
    await page.waitForTimeout(300);

    await expect(page.locator(".rbc-time-view")).toBeVisible();
  });
});

test.describe("Página pública — calendario", () => {
  test("carga la página de inicio", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/OpenGig/);
  });

  test("muestra el encabezado con el logo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
  });

  test("navegar a /login no da 404", async ({ page }) => {
    await page.goto("/login");
    await expect(page).not.toHaveURL(/404/);
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("navegar a /register no da 404", async ({ page }) => {
    await page.goto("/register");
    await expect(page).not.toHaveURL(/404/);
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("rutas protegidas redirigen a /login", async ({ page }) => {
    await page.goto("/me/calendar");
    await expect(page).toHaveURL(/\/login/);
  });
});
