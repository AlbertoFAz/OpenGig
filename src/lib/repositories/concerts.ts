import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

export type Concert = Database["public"]["Tables"]["concerts"]["Row"];
export type ConcertInsert = Database["public"]["Tables"]["concerts"]["Insert"];
export type ConcertUpdate = Database["public"]["Tables"]["concerts"]["Update"];

export type Result<T, E = string> = { ok: true; data: T } | { ok: false; error: E };

/** Conciertos públicos de los próximos N días para el calendario público */
export async function getUpcomingConcerts(days = 90): Promise<Concert[]> {
  const supabase = await createClient();
  const from = new Date().toISOString();
  const to = new Date(Date.now() + days * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("concerts")
    .select("*")
    .eq("visibility", "PUBLIC")
    .gte("date_time", from)
    .lte("date_time", to)
    .order("date_time", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type ConcertWithCreator = Concert & {
  profiles: { display_name: string; prestige: number; role: string; username: string } | null;
};

/** Top conciertos de los próximos 90 días para la sección "Populares" */
export async function getFeaturedConcerts(): Promise<ConcertWithCreator[]> {
  const supabase = await createClient();
  const from = new Date().toISOString();
  const to = new Date(Date.now() + 90 * 86_400_000).toISOString();

  const { data } = await supabase
    .from("concerts")
    .select("*, profiles!created_by(display_name, prestige, role, username)")
    .eq("visibility", "PUBLIC")
    .gte("date_time", from)
    .lte("date_time", to)
    .order("likes_count", { ascending: false })
    .limit(30);

  return (data ?? []) as ConcertWithCreator[];
}

/** Detalle de un concierto por id */
export async function getConcertById(id: string): Promise<
  Result<
    Concert & {
      profiles: { username: string; display_name: string; role: string } | null;
    }
  >
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("concerts")
    .select("*, profiles!created_by(username, display_name, role)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Concierto no encontrado." };
  return { ok: true, data };
}

/** Crear un concierto */
export async function createConcert(payload: ConcertInsert): Promise<Result<Concert>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("concerts").insert(payload).select().single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

/** Actualizar un concierto */
export async function updateConcert(id: string, payload: ConcertUpdate): Promise<Result<Concert>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("concerts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Concierto no encontrado." };
  return { ok: true, data };
}

/** Eliminar un concierto */
export async function deleteConcert(id: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.from("concerts").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
