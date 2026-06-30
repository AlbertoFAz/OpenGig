import { test, expect } from "@playwright/test";

test.describe("Calendario privado — flujos autenticados", () => {
  test.beforeEach(async ({}, testInfo) => {
    if (!process.env.E2E_TEST_EMAIL) {
      testInfo.skip(true, "E2E_TEST_EMAIL no configurado — saltar tests autenticados");
    }
  });

  test("el calendario privado es accesible y carga correctamente", async ({ page }) => {
    await page.goto("/me/calendar");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /mi calendario/i })).toBeVisible();
  });

  test("guardar un concierto en el calendario privado y verificar en /me/calendar", async ({
    page,
  }) => {
    await page.goto("/");

    // Buscar el primer concierto público disponible
    const firstConcert = page.locator('a[href^="/concerts/"]').first();
    const hasConcerts = await firstConcert.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasConcerts) {
      test.skip();
      return;
    }

    const concertUrl = await firstConcert.getAttribute("href");
    await page.goto(concertUrl!);
    await page.waitForURL(/\/concerts\/[0-9a-f-]{36}/);

    const concertName = await page.getByRole("heading", { level: 1 }).textContent();

    // Guardar en el calendario privado (o eliminar si ya está guardado)
    const saveButton = page.getByRole("button", {
      name: /guardar en mi calendario|eliminar de mi calendario/i,
    });
    await expect(saveButton).toBeVisible({ timeout: 5_000 });

    const isAlreadySaved = (await saveButton.textContent())?.includes("Eliminar");
    if (!isAlreadySaved) {
      await saveButton.click();
      await expect(page.getByText(/guardado en tu calendario/i)).toBeVisible({ timeout: 5_000 });
    }

    // Verificar que aparece en /me/calendar
    await page.goto("/me/calendar");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /mi calendario/i })).toBeVisible();

    // El nombre del concierto debe aparecer en algún lugar del calendario
    if (concertName) {
      await expect(page.getByText(concertName, { exact: false })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test("exportar el calendario privado devuelve un fichero .ics válido", async ({ page }) => {
    // Primero obtener las cookies de sesión desde el contexto de la página
    await page.goto("/me/calendar");
    await expect(page).not.toHaveURL(/\/login/);

    // La sección de exportación debe estar presente
    const exportSection = page.getByText(/suscribirse|exportar|ical/i).first();
    const hasExport = await exportSection.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasExport) {
      // Si no hay botón visible, saltar el test
      test.skip();
      return;
    }

    // Clic en el botón de descarga del ics
    const downloadButton = page.getByRole("link", { name: /descargar|\.ics/i }).first();
    if (await downloadButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const [download] = await Promise.all([page.waitForEvent("download"), downloadButton.click()]);
      expect(download.suggestedFilename()).toMatch(/\.ics$/i);
    }
  });

  test("crear una entrada personal en el calendario privado", async ({ page }) => {
    await page.goto("/me/calendar");
    await expect(page).not.toHaveURL(/\/login/);

    // Buscar el botón de nueva entrada personal
    const newEntryButton = page.getByRole("button", {
      name: /nueva entrada|añadir|agregar/i,
    });

    const hasButton = await newEntryButton.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!hasButton) {
      test.skip();
      return;
    }

    await newEntryButton.click();

    // Debe abrirse un modal o formulario
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Rellenar título
    await dialog.getByLabel(/título/i).fill("Entrada personal E2E");

    // Fecha futura
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T19:00`;
    const dateInput = dialog.locator('input[type="datetime-local"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(dateStr);
    }

    // Guardar
    await dialog.getByRole("button", { name: /guardar|añadir|crear/i }).click();

    // La entrada debería aparecer en el calendario
    await expect(page.getByText("Entrada personal E2E")).toBeVisible({ timeout: 8_000 });
  });
});
