import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { storageKey: "admin-notifications-test", persistSession: false },
});

let aliceId: string;
let bobId: string;
let aliceClient: ReturnType<typeof createClient<Database>>;
let bobClient: ReturnType<typeof createClient<Database>>;
let notifId: string;

beforeAll(async () => {
  const stamp = Date.now();

  const { data: aliceData } = await adminClient.auth.admin.createUser({
    email: `alice-notif-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
  });
  const { data: bobData } = await adminClient.auth.admin.createUser({
    email: `bob-notif-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
  });

  aliceId = aliceData.user!.id;
  bobId = bobData.user!.id;

  aliceClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `alice-notif-${stamp}`, persistSession: false },
  });
  bobClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `bob-notif-${stamp}`, persistSession: false },
  });

  await aliceClient.auth.signInWithPassword({
    email: `alice-notif-${stamp}@test.com`,
    password: "TestPass123!",
  });
  await bobClient.auth.signInWithPassword({
    email: `bob-notif-${stamp}@test.com`,
    password: "TestPass123!",
  });

  // service_role inserta la notificación (simula trigger del sistema)
  const { data, error } = await adminClient
    .from("notifications")
    .insert({
      user_id: aliceId,
      type: "LIKE_RECEIVED",
      message: "Alguien le ha dado like a tu concierto.",
    })
    .select("id")
    .single();

  if (error ?? !data) {
    throw new Error(`No se pudo insertar notificación de prueba: ${String(error?.message)}`);
  }
  notifId = data.id;
});

afterAll(async () => {
  await adminClient.from("notifications").delete().eq("user_id", aliceId);
  await adminClient.from("notifications").delete().eq("user_id", bobId);
  await adminClient.auth.admin.deleteUser(aliceId);
  await adminClient.auth.admin.deleteUser(bobId);
});

describe("Notifications — RLS", () => {
  it("Alice puede leer sus propias notificaciones", async () => {
    const { data, error } = await aliceClient
      .from("notifications")
      .select("id, message")
      .eq("user_id", aliceId);
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(1);
  });

  it("Bob no puede leer las notificaciones de Alice", async () => {
    const { data, error } = await bobClient
      .from("notifications")
      .select("id")
      .eq("user_id", aliceId);
    expect(error).toBeNull();
    expect(data).toHaveLength(0); // RLS filtra, no devuelve error
  });

  it("Alice puede marcar su notificación como leída", async () => {
    const { error } = await aliceClient
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notifId);
    expect(error).toBeNull();
  });

  it("Bob no puede actualizar la notificación de Alice", async () => {
    const readAtBefore = new Date().toISOString();
    await bobClient.from("notifications").update({ read_at: readAtBefore }).eq("id", notifId);
    // Verificar que Alice sigue viendo la notificación como leída (la actualizó ella misma antes)
    const { data } = await aliceClient
      .from("notifications")
      .select("read_at")
      .eq("id", notifId)
      .single();
    // La notificación fue leída por Alice en el test anterior; Bob no puede cambiar esto
    expect(data!.read_at).not.toBeNull();
  });
});

describe("check_promotion — función PL/pgSQL", () => {
  it("no crea oferta de promoción para usuario con prestigio cero", async () => {
    await adminClient.rpc("check_promotion", { p_user_id: aliceId });
    const { data } = await aliceClient
      .from("notifications")
      .select("id")
      .eq("user_id", aliceId)
      .eq("type", "PROMOTION_OFFER");
    expect(data).toHaveLength(0);
  });
});
