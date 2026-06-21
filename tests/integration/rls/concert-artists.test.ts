import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SUPABASE_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const adminClient = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { storageKey: "admin-concert-artists-test", persistSession: false },
});

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

let venueId: string;
let artistId: string;
let otherVenueId: string;
let venueClient: ReturnType<typeof createClient<Database>>;
let artistClient: ReturnType<typeof createClient<Database>>;
let otherVenueClient: ReturnType<typeof createClient<Database>>;
let concertId: string;

beforeAll(async () => {
  const stamp = Date.now();

  const [venueData, artistData, otherVenueData] = await Promise.all([
    adminClient.auth.admin.createUser({
      email: `venue-ca-${stamp}@test.com`,
      password: "TestPass123!",
      email_confirm: true,
      user_metadata: { role: "VENUE" },
    }),
    adminClient.auth.admin.createUser({
      email: `artist-ca-${stamp}@test.com`,
      password: "TestPass123!",
      email_confirm: true,
      user_metadata: { role: "ARTIST" },
    }),
    adminClient.auth.admin.createUser({
      email: `othervenue-ca-${stamp}@test.com`,
      password: "TestPass123!",
      email_confirm: true,
      user_metadata: { role: "VENUE" },
    }),
  ]);

  venueId = venueData.data.user!.id;
  artistId = artistData.data.user!.id;
  otherVenueId = otherVenueData.data.user!.id;

  venueClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `venue-ca-${stamp}`, persistSession: false },
  });
  artistClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `artist-ca-${stamp}`, persistSession: false },
  });
  otherVenueClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { storageKey: `othervenue-ca-${stamp}`, persistSession: false },
  });

  await Promise.all([
    venueClient.auth.signInWithPassword({
      email: `venue-ca-${stamp}@test.com`,
      password: "TestPass123!",
    }),
    artistClient.auth.signInWithPassword({
      email: `artist-ca-${stamp}@test.com`,
      password: "TestPass123!",
    }),
    otherVenueClient.auth.signInWithPassword({
      email: `othervenue-ca-${stamp}@test.com`,
      password: "TestPass123!",
    }),
  ]);

  // La venue crea un concierto público
  const { data: concert, error } = await venueClient
    .from("concerts")
    .insert({
      created_by: venueId,
      name: "Concierto de test concert_artists",
      date_time: tomorrow(),
      venue_name: "Sala Test",
      visibility: "PUBLIC",
    })
    .select()
    .single();
  if (error) throw new Error(`Error creando concierto: ${error.message}`);
  concertId = concert!.id;
});

afterAll(async () => {
  await adminClient.from("concerts").delete().eq("id", concertId);
  await Promise.all([
    adminClient.auth.admin.deleteUser(venueId),
    adminClient.auth.admin.deleteUser(artistId),
    adminClient.auth.admin.deleteUser(otherVenueId),
  ]);
});

describe("RLS concert_artists", () => {
  it("usuario anónimo puede leer concert_artists", async () => {
    const anonClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
      auth: { storageKey: "anon-ca-test", persistSession: false },
    });
    const { error } = await anonClient
      .from("concert_artists")
      .select("*")
      .eq("concert_id", concertId);
    expect(error).toBeNull();
  });

  it("el dueño del concierto puede vincular un artista", async () => {
    const { error } = await venueClient.from("concert_artists").insert({
      concert_id: concertId,
      artist_profile_id: artistId,
    });
    expect(error).toBeNull();
  });

  it("el dueño puede leer los artistas del concierto", async () => {
    const { data, error } = await venueClient
      .from("concert_artists")
      .select("*")
      .eq("concert_id", concertId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data![0]!.artist_profile_id).toBe(artistId);
  });

  it("artista autenticado puede leer concert_artists", async () => {
    const { data, error } = await artistClient
      .from("concert_artists")
      .select("*")
      .eq("concert_id", concertId);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });

  it("otro usuario NO puede vincular artistas a un concierto ajeno", async () => {
    const { error } = await otherVenueClient.from("concert_artists").insert({
      concert_id: concertId,
      artist_profile_id: otherVenueId,
    });
    expect(error).not.toBeNull();
  });

  it("otro usuario NO puede eliminar artistas de un concierto ajeno", async () => {
    // RLS filtra la fila antes de borrar: DELETE afecta 0 filas sin error explícito.
    // Verificamos que la fila sigue existiendo tras el intento.
    await otherVenueClient.from("concert_artists").delete().eq("concert_id", concertId);

    const { data } = await venueClient
      .from("concert_artists")
      .select("*")
      .eq("concert_id", concertId);
    expect(data).toHaveLength(1); // el vínculo sigue existiendo
  });

  it("el dueño puede eliminar un artista del concierto", async () => {
    const { error } = await venueClient
      .from("concert_artists")
      .delete()
      .eq("concert_id", concertId)
      .eq("artist_profile_id", artistId);
    expect(error).toBeNull();
  });
});

describe("RLS concerts: restricción de rol para insertar", () => {
  it("usuario con rol USER no puede crear concierto público", async () => {
    const stamp = Date.now();
    const { data: userData } = await adminClient.auth.admin.createUser({
      email: `user-role-${stamp}@test.com`,
      password: "TestPass123!",
      email_confirm: true,
    });
    const userId = userData.user!.id;

    const userClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
      auth: { storageKey: `user-role-${stamp}`, persistSession: false },
    });
    await userClient.auth.signInWithPassword({
      email: `user-role-${stamp}@test.com`,
      password: "TestPass123!",
    });

    const { error } = await userClient.from("concerts").insert({
      created_by: userId,
      name: "Concierto no permitido",
      date_time: tomorrow(),
      venue_name: "Sala",
      visibility: "PUBLIC",
    });
    expect(error).not.toBeNull();

    await adminClient.auth.admin.deleteUser(userId);
  });

  it("usuario con rol USER sí puede crear concierto privado", async () => {
    const stamp = Date.now();
    const { data: userData } = await adminClient.auth.admin.createUser({
      email: `user-priv-${stamp}@test.com`,
      password: "TestPass123!",
      email_confirm: true,
    });
    const userId = userData.user!.id;

    const userClient = createClient<Database>(SUPABASE_URL, ANON_KEY, {
      auth: { storageKey: `user-priv-${stamp}`, persistSession: false },
    });
    await userClient.auth.signInWithPassword({
      email: `user-priv-${stamp}@test.com`,
      password: "TestPass123!",
    });

    const { data, error } = await userClient
      .from("concerts")
      .insert({
        created_by: userId,
        name: "Concierto privado",
        date_time: tomorrow(),
        venue_name: "Sala",
        visibility: "PRIVATE",
      })
      .select()
      .single();
    expect(error).toBeNull();

    if (data) {
      await adminClient.from("concerts").delete().eq("id", data.id);
    }
    await adminClient.auth.admin.deleteUser(userId);
  });
});
