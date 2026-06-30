import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

export const authFile = path.join(__dirname, ".auth/user.json");

setup("autenticar usuario de prueba", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  // Sin credenciales creamos un estado vacío para que Playwright no falle al cargar el fichero
  if (!email || !password) {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto("/login");
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /entrar|iniciar sesión/i }).click();

  // Esperar a salir de /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

  // Guardar cookies y localStorage con la sesión activa
  await page.context().storageState({ path: authFile });
});
