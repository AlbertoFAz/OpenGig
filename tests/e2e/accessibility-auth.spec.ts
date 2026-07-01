import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Este fichero requiere autenticación (proyecto "authenticated" en playwright.config.ts).
// Si no hay credenciales configuradas se saltan todos los tests.

const authenticatedRoutes = ["/me/calendar", "/me/profile", "/concerts/new"];

for (const route of authenticatedRoutes) {
  test(`accesibilidad (autenticado): ${route} no tiene violaciones críticas`, async ({ page }) => {
    if (!process.env.E2E_TEST_EMAIL) {
      test.skip();
      return;
    }

    await page.goto(route);
    // Si redirige a login, las credenciales no están configuradas
    if (page.url().includes("/login")) {
      test.skip();
      return;
    }

    // Esperar a que el contenido principal esté renderizado
    await page.waitForSelector("main, [role='main']", { timeout: 15_000 });
    // Dar tiempo extra al calendario (lazy-loaded) si aplica
    if (route.includes("calendar")) {
      await page.waitForTimeout(2_000);
    }

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude("#__next-route-announcer__")
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(
      criticalViolations,
      `Violaciones críticas en ${route}:\n${criticalViolations
        .map((v) => `- ${v.id}: ${v.description}`)
        .join("\n")}`
    ).toHaveLength(0);
  });
}

test("accesibilidad (autenticado): detalle de un concierto público", async ({ page }) => {
  if (!process.env.E2E_TEST_EMAIL) {
    test.skip();
    return;
  }

  await page.goto("/");
  const firstConcert = page.locator('a[href^="/concerts/"]').first();
  const hasConcerts = await firstConcert.isVisible({ timeout: 8_000 }).catch(() => false);
  if (!hasConcerts) {
    test.skip();
    return;
  }

  await firstConcert.click();
  await page.waitForURL(/\/concerts\/[0-9a-f-]{36}/);
  await page.waitForSelector("main", { timeout: 10_000 });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude("#__next-route-announcer__")
    .analyze();

  const criticalViolations = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );

  expect(
    criticalViolations,
    `Violaciones críticas en página de concierto:\n${criticalViolations
      .map((v) => `- ${v.id}: ${v.description}`)
      .join("\n")}`
  ).toHaveLength(0);
});
