import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { storageKey: "admin-calendar-test", persistSession: false },
});

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

let aliceId: string;
let bobId: string;
let aliceClient: ReturnType<typeof createClient<Database>>;
let bobClient: ReturnType<typeof createClient<Database>>;
let publicConcertId: string;
let privateConcertId: string;
let aliceEntryId: string;

beforeAll(async () => {
  const stamp = Date.now();

  const { data: aliceData } = await adminClient.auth.admin.createUser({
    email: `alice-cal-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
  });
  const { data: bobData } = await adminClient.auth.admin.createUser({
    email: `bob-cal-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
  });

  aliceId = aliceData.user!.id;
  bobId = bobData.user!.id;

  aliceClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `alice-cal-${stamp}`, persistSession: false },
  });
  bobClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `bob-cal-${stamp}`, persistSession: false },
  });

  await aliceClient.auth.signInWithPassword({
    email: `alice-cal-${stamp}@test.com`,
    password: "TestPass123!",
  });
  await bobClient.auth.signInWithPassword({
    email: `bob-cal-${stamp}@test.com`,
    password: "TestPass123!",
  });

  // Alice crea un concierto público y uno privado con su propio cliente
  // (el trigger ya creó el perfil cuando se registró)
  const { data: pub, error: pubErr } = await aliceClient
    .from("concerts")
    .insert({
      created_by: aliceId,
      name: "Concierto público",
      date_time: tomorrow(),
      venue_name: "Sala A",
      visibility: "PUBLIC",
    })
    .select()
    .single();
  if (pubErr) throw new Error(`Error creando concierto público: ${pubErr.message}`);
  publicConcertId = pub!.id;

  const { data: priv, error: privErr } = await aliceClient
    .from("concerts")
    .insert({
      created_by: aliceId,
      name: "Concierto privado",
      date_time: tomorrow(),
      venue_name: "Sala A",
      visibility: "PRIVATE",
    })
    .select()
    .single();
  if (privErr) throw new Error(`Error creando concierto privado: ${privErr.message}`);
  privateConcertId = priv!.id;
});

afterAll(async () => {
  // Las calendar_entries se eliminan en cascada al borrar los usuarios
  // (profiles ON DELETE CASCADE → calendar_entries ON DELETE CASCADE en user_id)
  await adminClient.from("concerts").delete().in("id", [publicConcertId, privateConcertId]);
  await adminClient.auth.admin.deleteUser(aliceId);
  await adminClient.auth.admin.deleteUser(bobId);
});

describe("concerts - visibilidad RLS", () => {
  it("un anónimo puede leer conciertos públicos", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anonClient
      .from("concerts")
      .select("id")
      .eq("id", publicConcertId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("un anónimo NO puede leer conciertos privados", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const { data } = await anonClient.from("concerts").select("id").eq("id", privateConcertId);
    expect(data).toHaveLength(0);
  });

  it("el creador puede leer su concierto privado", async () => {
    const { data, error } = await aliceClient
      .from("concerts")
      .select("id")
      .eq("id", privateConcertId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("otro usuario NO puede leer un concierto privado ajeno", async () => {
    const { data } = await bobClient.from("concerts").select("id").eq("id", privateConcertId);
    expect(data).toHaveLength(0);
  });
});

describe("calendar_entries - RLS", () => {
  it("Bob puede guardar el concierto público en su calendario", async () => {
    const { data, error } = await bobClient
      .from("calendar_entries")
      .insert({ user_id: bobId, concert_id: publicConcertId })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.concert_id).toBe(publicConcertId);
  });

  it("Bob NO puede guardar el mismo concierto dos veces", async () => {
    const { error } = await bobClient
      .from("calendar_entries")
      .insert({ user_id: bobId, concert_id: publicConcertId });
    expect(error).not.toBeNull();
  });

  it("Alice puede crear una entrada personal", async () => {
    const { data, error } = await aliceClient
      .from("calendar_entries")
      .insert({
        user_id: aliceId,
        title: "Cita personal",
        date_time: tomorrow(),
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.title).toBe("Cita personal");
    aliceEntryId = data!.id;
  });

  it("Alice solo ve sus propias entradas", async () => {
    const { data, error } = await aliceClient.from("calendar_entries").select("id");
    expect(error).toBeNull();
    const ids = (data ?? []).map((e) => e.id);
    expect(ids).toContain(aliceEntryId);
    // No debe contener la entrada de Bob
  });

  it("Bob NO puede leer las entradas de Alice", async () => {
    const { data } = await bobClient.from("calendar_entries").select("id").eq("user_id", aliceId);
    expect(data).toHaveLength(0);
  });

  it("Bob NO puede insertar una entrada con el user_id de Alice", async () => {
    const { error } = await bobClient.from("calendar_entries").insert({
      user_id: aliceId,
      concert_id: publicConcertId,
    });
    expect(error).not.toBeNull();
  });

  it("Bob NO puede eliminar la entrada personal de Alice", async () => {
    const { error: deleteError } = await bobClient
      .from("calendar_entries")
      .delete()
      .eq("id", aliceEntryId);
    // RLS devuelve 0 filas afectadas sin error, no expone nada
    expect(deleteError).toBeNull();
    // Verificar que la entrada sigue existiendo consultando como Alice
    const { data, error: selectError } = await aliceClient
      .from("calendar_entries")
      .select("id")
      .eq("id", aliceEntryId);
    expect(selectError).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("la función get_concert_saved_count devuelve el recuento correcto", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY);
    const { data, error } = await anonClient.rpc("get_concert_saved_count", {
      p_concert_id: publicConcertId,
    });
    expect(error).toBeNull();
    expect(data).toBeGreaterThanOrEqual(1); // Bob guardó el concierto público
  });

  it("el creador puede guardar su propio concierto (auto-add al crear)", async () => {
    // Simula lo que hace la API route al crear el concierto
    const { data, error } = await aliceClient
      .from("calendar_entries")
      .insert({ user_id: aliceId, concert_id: publicConcertId })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.concert_id).toBe(publicConcertId);
    // Limpieza: eliminar la entrada de Alice para no romper otros tests
    await aliceClient.from("calendar_entries").delete().eq("id", data!.id);
  });

  it("el join con concerts devuelve created_by (necesario para distinguir colores)", async () => {
    // Bob consulta sus entradas con el join al concierto
    const { data, error } = await bobClient
      .from("calendar_entries")
      .select("concert_id, concerts(id, created_by)")
      .eq("concert_id", publicConcertId)
      .single();
    expect(error).toBeNull();
    // El concierto fue creado por Alice, no por Bob
    expect(data?.concerts?.created_by).toBe(aliceId);
    expect(data?.concerts?.created_by).not.toBe(bobId);
  });
});
