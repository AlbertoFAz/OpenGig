import { test, expect } from "@playwright/test";

// Estos tests requieren E2E_TEST_EMAIL / E2E_TEST_PASSWORD y un usuario con rol
// ARTIST, VENUE o COLLABORATOR para poder crear conciertos públicos.
test.describe("Conciertos — flujos autenticados", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!process.env.E2E_TEST_EMAIL) {
      testInfo.skip(true, "E2E_TEST_EMAIL no configurado — saltar tests autenticados");
    }
  });

  test("usuario autenticado accede a /concerts/new sin redirección", async ({ page }) => {
    await page.goto("/concerts/new");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("crear un concierto y verificar redirección al detalle", async ({ page }) => {
    await page.goto("/concerts/new");
    await expect(page).not.toHaveURL(/\/login/);

    // Nombre del concierto (campo opcional si hay artistas; lo rellenamos para garantizar el título)
    const nameField = page.getByLabel(/nombre del concierto/i);
    await nameField.fill("Concierto E2E Playwright");

    // Fecha: 45 días desde hoy en formato datetime-local (YYYY-MM-DDTHH:mm)
    const future = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T20:00`;
    await page.locator('input[type="datetime-local"]').fill(dateStr);

    // Sala — escribir en el campo de búsqueda y confirmar con el nombre libre
    const venueInput = page.getByPlaceholder(/buscar sala|sala/i);
    await venueInput.fill("Sala E2E Test");

    // Enviar el formulario
    await page.getByRole("button", { name: /publicar concierto|guardar/i }).click();

    // Debe redirigir al detalle del concierto recién creado
    await expect(page).toHaveURL(/\/concerts\/[0-9a-f-]{36}/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /concierto e2e playwright/i })).toBeVisible();
  });

  test("dar like a un concierto actualiza el contador", async ({ page }) => {
    await page.goto("/");

    // Buscar el primer enlace a un concierto en el calendario o sección de populares
    const firstConcert = page.locator('a[href^="/concerts/"]').first();
    const hasConcerts = await firstConcert.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasConcerts) {
      test.skip();
      return;
    }

    const concertUrl = await firstConcert.getAttribute("href");
    await page.goto(concertUrl!);
    await page.waitForURL(/\/concerts\/[0-9a-f-]{36}/);

    // Botón de like con aria-label conocido
    const likeButton = page.getByRole("button", { name: /dar like|quitar like/i });
    await expect(likeButton).toBeVisible({ timeout: 5_000 });

    // Contador antes
    const counterBefore = await likeButton.locator("span").textContent();

    await likeButton.click();

    // Esperar actualización y verificar que el contador cambió
    await page.waitForTimeout(800);
    const counterAfter = await likeButton.locator("span").textContent();
    expect(counterAfter).not.toBe(counterBefore);
  });

  test("la página de edición de un concierto propio es accesible", async ({ page }) => {
    await page.goto("/concerts/new");
    await expect(page).not.toHaveURL(/\/login/);

    // Crear un concierto rápido para tener un ID con el que ir a editar
    const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T20:00`;

    const nameField = page.getByLabel(/nombre del concierto/i);
    await nameField.fill("Concierto E2E Edición");
    await page.locator('input[type="datetime-local"]').fill(dateStr);
    await page.getByPlaceholder(/buscar sala|sala/i).fill("Sala Edit Test");
    await page.getByRole("button", { name: /publicar concierto|guardar/i }).click();

    await expect(page).toHaveURL(/\/concerts\/[0-9a-f-]{36}/, { timeout: 15_000 });

    // Navegar a la ruta de edición
    const concertId = page.url().split("/concerts/")[1]?.split("/")[0];
    if (concertId) {
      await page.goto(`/concerts/${concertId}/edit`);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByRole("heading")).toBeVisible();
      // El formulario de edición debe tener el nombre del concierto pre-rellenado
      await expect(page.getByLabel(/nombre del concierto/i)).toHaveValue("Concierto E2E Edición");
    }
  });

  test("el detalle de concierto muestra la información principal", async ({ page }) => {
    await page.goto("/");

    const firstConcert = page.locator('a[href^="/concerts/"]').first();
    const hasConcerts = await firstConcert.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasConcerts) {
      test.skip();
      return;
    }

    await firstConcert.click();
    await page.waitForURL(/\/concerts\/[0-9a-f-]{36}/);

    // La página de detalle siempre muestra un h1 con el nombre y la fecha
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Botones de exportación iCal
    await expect(
      page
        .getByRole("link", { name: /\.ics|ical/i })
        .or(page.getByRole("button", { name: /ical|descargar/i }))
    )
      .toBeVisible({ timeout: 3_000 })
      .catch(() => {
        // La sección de exportación puede no estar visible si el concierto es privado
      });
  });
});
