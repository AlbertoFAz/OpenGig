import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { storageKey: "admin-concerts-test", persistSession: false },
});

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

let ownerUserId: string;
let otherUserId: string;
let ownerClient: ReturnType<typeof createClient<Database>>;
let otherClient: ReturnType<typeof createClient<Database>>;
let concertId: string;

beforeAll(async () => {
  const stamp = Date.now();
  const ownerEmail = `owner-concerts-${stamp}@test.com`;
  const otherEmail = `other-concerts-${stamp}@test.com`;

  const { data: ownerData } = await adminClient.auth.admin.createUser({
    email: ownerEmail,
    password: "TestPass123!",
    email_confirm: true,
  });
  const { data: otherData } = await adminClient.auth.admin.createUser({
    email: otherEmail,
    password: "TestPass123!",
    email_confirm: true,
  });

  ownerUserId = ownerData.user!.id;
  otherUserId = otherData.user!.id;

  // Cada cliente tiene su propio storageKey para evitar colisión de sesión en jsdom
  ownerClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `owner-concerts-${stamp}`, persistSession: false },
  });
  otherClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `other-concerts-${stamp}`, persistSession: false },
  });

  await ownerClient.auth.signInWithPassword({ email: ownerEmail, password: "TestPass123!" });
  await otherClient.auth.signInWithPassword({ email: otherEmail, password: "TestPass123!" });

  const { data, error } = await ownerClient
    .from("concerts")
    .insert({
      created_by: ownerUserId,
      name: "Concierto de test",
      date_time: tomorrow(),
      venue_name: "Sala de prueba",
    })
    .select()
    .single();

  if (error) throw new Error(`Error creando concierto de test: ${error.message}`);
  concertId = data.id;
});

afterAll(async () => {
  await adminClient.from("concerts").delete().eq("id", concertId);
  await adminClient.auth.admin.deleteUser(ownerUserId);
  await adminClient.auth.admin.deleteUser(otherUserId);
});

describe("RLS concerts", () => {
  it("usuario anónimo puede leer conciertos", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
      auth: { storageKey: "anon-concerts-test", persistSession: false },
    });
    const { data, error } = await anonClient.from("concerts").select("id").eq("id", concertId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("propietario puede actualizar su concierto", async () => {
    const { error } = await ownerClient
      .from("concerts")
      .update({ description: "Actualizado" })
      .eq("id", concertId);
    expect(error).toBeNull();
  });

  it("otro usuario autenticado no puede actualizar un concierto ajeno", async () => {
    const { data } = await otherClient
      .from("concerts")
      .update({ description: "Hackeado" })
      .eq("id", concertId)
      .select();
    // RLS bloquea silenciosamente: no error, pero sin filas afectadas
    expect(data).toHaveLength(0);
  });

  it("propietario puede eliminar su concierto", async () => {
    const { data: temp, error: insertErr } = await ownerClient
      .from("concerts")
      .insert({
        created_by: ownerUserId,
        name: "Temporal",
        date_time: tomorrow(),
        venue_name: "Sala temp",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    const { error } = await ownerClient.from("concerts").delete().eq("id", temp.id);

    expect(error).toBeNull();
  });

  it("otro usuario no puede eliminar un concierto ajeno", async () => {
    await otherClient.from("concerts").delete().eq("id", concertId);

    // Verificar que sigue existiendo
    const { data } = await ownerClient.from("concerts").select("id").eq("id", concertId);
    expect(data).toHaveLength(1);
  });
});
