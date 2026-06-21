import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { storageKey: "admin-likes-test", persistSession: false },
});

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

let authorUserId: string;
let likerUserId: string;
let otherUserId: string;
let authorClient: ReturnType<typeof createClient<Database>>;
let likerClient: ReturnType<typeof createClient<Database>>;
let otherClient: ReturnType<typeof createClient<Database>>;
let concertId: string;

beforeAll(async () => {
  const stamp = Date.now();

  const { data: authorData } = await adminClient.auth.admin.createUser({
    email: `author-likes-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
    user_metadata: { role: "ARTIST" },
  });
  const { data: likerData } = await adminClient.auth.admin.createUser({
    email: `liker-likes-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
  });
  const { data: otherData } = await adminClient.auth.admin.createUser({
    email: `other-likes-${stamp}@test.com`,
    password: "TestPass123!",
    email_confirm: true,
  });

  authorUserId = authorData.user!.id;
  likerUserId = likerData.user!.id;
  otherUserId = otherData.user!.id;

  authorClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `author-likes-${stamp}`, persistSession: false },
  });
  likerClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `liker-likes-${stamp}`, persistSession: false },
  });
  otherClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `other-likes-${stamp}`, persistSession: false },
  });

  await authorClient.auth.signInWithPassword({
    email: `author-likes-${stamp}@test.com`,
    password: "TestPass123!",
  });
  await likerClient.auth.signInWithPassword({
    email: `liker-likes-${stamp}@test.com`,
    password: "TestPass123!",
  });
  await otherClient.auth.signInWithPassword({
    email: `other-likes-${stamp}@test.com`,
    password: "TestPass123!",
  });

  // Crear un concierto del autor
  const { data: concertData } = await authorClient
    .from("concerts")
    .insert({
      name: "Concierto de prueba likes",
      date_time: tomorrow(),
      venue_name: "Sala Test",
      visibility: "PUBLIC",
      created_by: authorUserId,
    })
    .select("id")
    .single();
  concertId = concertData!.id;
});

afterAll(async () => {
  await adminClient.from("concerts").delete().eq("id", concertId);
  await adminClient.auth.admin.deleteUser(authorUserId);
  await adminClient.auth.admin.deleteUser(likerUserId);
  await adminClient.auth.admin.deleteUser(otherUserId);
});

describe("Likes — RLS", () => {
  it("usuario autenticado puede dar like", async () => {
    const { error } = await likerClient
      .from("likes")
      .insert({ user_id: likerUserId, concert_id: concertId });
    expect(error).toBeNull();
  });

  it("likes_count del concierto se incrementa tras el like", async () => {
    const { data } = await likerClient
      .from("concerts")
      .select("likes_count")
      .eq("id", concertId)
      .single();
    expect(data!.likes_count).toBe(1);
  });

  it("usuario no puede insertar like en nombre de otro usuario", async () => {
    const { error } = await otherClient
      .from("likes")
      .insert({ user_id: likerUserId, concert_id: concertId });
    expect(error).not.toBeNull();
  });

  it("usuario puede leer likes (contadores)", async () => {
    const { data, error } = await otherClient
      .from("likes")
      .select("user_id")
      .eq("concert_id", concertId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("usuario no puede eliminar el like de otro usuario", async () => {
    await otherClient.from("likes").delete().eq("user_id", likerUserId).eq("concert_id", concertId);
    // RLS silencia la operación sin error pero no elimina la fila
    const { data } = await likerClient.from("likes").select("user_id").eq("concert_id", concertId);
    expect(data).toHaveLength(1);
  });

  it("usuario puede eliminar su propio like", async () => {
    const { error } = await likerClient
      .from("likes")
      .delete()
      .eq("user_id", likerUserId)
      .eq("concert_id", concertId);
    expect(error).toBeNull();
  });

  it("likes_count decrece al quitar el like", async () => {
    const { data } = await likerClient
      .from("concerts")
      .select("likes_count")
      .eq("id", concertId)
      .single();
    expect(data!.likes_count).toBe(0);
  });

  it("prestige del autor se actualiza al dar like", async () => {
    // Dar like
    await likerClient.from("likes").insert({ user_id: likerUserId, concert_id: concertId });

    const { data } = await likerClient
      .from("profiles")
      .select("prestige")
      .eq("id", authorUserId)
      .single();
    // Con decaimiento exponencial, 1 like reciente ≈ 1 punto de prestigio
    expect(data!.prestige).toBeGreaterThanOrEqual(1);

    // Quitar el like
    await likerClient.from("likes").delete().eq("user_id", likerUserId).eq("concert_id", concertId);
  });
});

describe("Likes — usuario no autenticado", () => {
  const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: "anon-likes-test", persistSession: false },
  });

  it("anónimo puede leer likes", async () => {
    const { error } = await anonClient.from("likes").select("user_id").eq("concert_id", concertId);
    expect(error).toBeNull();
  });

  it("anónimo no puede insertar likes", async () => {
    const { error } = await anonClient
      .from("likes")
      .insert({ user_id: likerUserId, concert_id: concertId });
    expect(error).not.toBeNull();
  });
});
