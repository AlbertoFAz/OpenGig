import { test, expect } from "@playwright/test";

test.describe("Exportación iCal", () => {
  test("el endpoint de exportación de calendario personal requiere auth", async ({ request }) => {
    const response = await request.get("/api/me/calendar/export.ics");
    // Sin sesión debe devolver 401 o redirigir
    expect([401, 302, 307]).toContain(response.status());
  });

  test("la URL de exportación de un concierto inexistente devuelve 404", async ({ request }) => {
    const response = await request.get(
      "/api/concerts/00000000-0000-0000-0000-000000000000/export.ics"
    );
    expect(response.status()).toBe(404);
  });
});
