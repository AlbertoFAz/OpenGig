import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Result } from "./concerts";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type ProfileWithConcerts = Profile & {
  concerts: Array<{
    id: string;
    name: string;
    date_time: string;
    venue_name: string;
    image_url: string | null;
    visibility: Database["public"]["Enums"]["concert_visibility"];
  }>;
};

/** Obtener un perfil público por username */
export async function getProfileByUsername(username: string): Promise<Result<ProfileWithConcerts>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, concerts!created_by(id, name, date_time, venue_name, image_url, visibility)")
    .eq("username", username)
    .eq("concerts.visibility", "PUBLIC")
    .single();

  if (error || !data) return { ok: false, error: "Perfil no encontrado." };
  return { ok: true, data: data as unknown as ProfileWithConcerts };
}

/** Obtener el perfil del usuario autenticado */
export async function getMyProfile(): Promise<Result<Profile>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (error || !data) return { ok: false, error: "Perfil no encontrado." };
  return { ok: true, data };
}

/** Actualizar el perfil del usuario autenticado */
export async function updateMyProfile(
  payload: Partial<
    Omit<Profile, "id" | "created_at" | "updated_at" | "role" | "prestige" | "username">
  >
): Promise<Result<Profile>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select()
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Error al actualizar." };
  return { ok: true, data };
}

/** Buscar artistas por nombre (para el selector de artistas en el formulario de concierto) */
export async function searchArtists(query: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, image_url, role")
    .eq("role", "ARTIST")
    .ilike("display_name", `%${query}%`)
    .limit(10);

  return (data ?? []) as Profile[];
}

/** Obtener los artistas de un concierto */
export async function getConcertArtists(concertId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("concert_artists")
    .select("profiles(id, username, display_name, image_url, role)")
    .eq("concert_id", concertId);

  if (!data) return [];
  return data.flatMap((row) => (row.profiles ? [row.profiles as unknown as Profile] : []));
}

/** Sincronizar los artistas de un concierto (reemplazar lista completa) */
export async function syncConcertArtists(
  concertId: string,
  artistIds: string[]
): Promise<Result<void>> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("concert_artists")
    .delete()
    .eq("concert_id", concertId);

  if (deleteError) return { ok: false, error: deleteError.message };
  if (artistIds.length === 0) return { ok: true, data: undefined };

  const rows = artistIds.map((id) => ({ concert_id: concertId, artist_profile_id: id }));
  const { error: insertError } = await supabase.from("concert_artists").insert(rows);

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true, data: undefined };
}
