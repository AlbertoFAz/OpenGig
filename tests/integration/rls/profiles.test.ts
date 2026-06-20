/**
 * Tests de integración para las políticas RLS de la tabla `profiles`.
 * Requiere Supabase local en marcha: `supabase start`
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Cliente con privilegios de administración para setup/teardown
const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL_A = `rls-test-a-${Date.now()}@test.local`;
const EMAIL_B = `rls-test-b-${Date.now()}@test.local`;
const PASSWORD = "TestPassword123!";

let userAId: string;
let userBId: string;

async function signUp(email: string) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function signInClient(email: string) {
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return client;
}

beforeAll(async () => {
  userAId = await signUp(EMAIL_A);
  userBId = await signUp(EMAIL_B);
});

afterAll(async () => {
  await adminClient.auth.admin.deleteUser(userAId);
  await adminClient.auth.admin.deleteUser(userBId);
});

describe("profiles — lectura pública", () => {
  it("un usuario anónimo puede leer perfiles", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anonClient
      .from("profiles")
      .select("id")
      .eq("id", userAId)
      .maybeSingle();
    expect(error).toBeNull();
    expect(data).not.toBeNull();
  });
});

describe("profiles — modificación", () => {
  it("el dueño puede actualizar su propio display_name", async () => {
    const clientA = await signInClient(EMAIL_A);
    const { error } = await clientA
      .from("profiles")
      .update({ display_name: "Nombre actualizado" })
      .eq("id", userAId);
    expect(error).toBeNull();
  });

  it("otro usuario NO puede actualizar el perfil ajeno", async () => {
    const clientB = await signInClient(EMAIL_B);
    await clientB.from("profiles").update({ display_name: "Intento malicioso" }).eq("id", userAId);
    // RLS debe impedir la actualización (0 filas afectadas, no error de permisos en PostgREST)
    // Verificamos que el nombre NO cambió
    const { data } = await adminClient
      .from("profiles")
      .select("display_name")
      .eq("id", userAId)
      .single();
    expect(data?.display_name).not.toBe("Intento malicioso");
  });

  it("un usuario anónimo NO puede actualizar ningún perfil", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const { error: anonUpdateError } = await anonClient
      .from("profiles")
      .update({ display_name: "Anon hack" })
      .eq("id", userAId);
    // Sin sesión, RLS bloquea
    expect(anonUpdateError).not.toBeNull();
  });
});
