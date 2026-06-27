import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const publicRoutes = ["/", "/login", "/register", "/forgot-password"];

for (const route of publicRoutes) {
  test(`accesibilidad: ${route} no tiene violaciones críticas`, async ({ page }) => {
    await page.goto(route);
    // Esperar a que el contenido principal esté visible
    await page.waitForSelector("main, [role='main'], body", { timeout: 10_000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude("#__next-route-announcer__") // Excluir el anunciador de rutas de Next.js
      .analyze();

    // Filtramos a critical e important para no bloquear por minor
    const criticalViolations = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(
      criticalViolations,
      `Violaciones críticas de accesibilidad en ${route}:\n${criticalViolations.map((v) => `- ${v.id}: ${v.description}`).join("\n")}`
    ).toHaveLength(0);
  });
}
