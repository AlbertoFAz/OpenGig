import { test, expect } from "@playwright/test";

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
