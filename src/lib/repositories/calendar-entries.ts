import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Result } from "./concerts";

export type CalendarEntry = Database["public"]["Tables"]["calendar_entries"]["Row"];
export type CalendarEntryInsert = Database["public"]["Tables"]["calendar_entries"]["Insert"];

export type Concert = Database["public"]["Tables"]["concerts"]["Row"];

export type CalendarEntryWithConcert = CalendarEntry & {
  concerts: Pick<
    Concert,
    "id" | "name" | "date_time" | "venue_name" | "image_url" | "visibility"
  > | null;
};

/** Entradas del calendario privado del usuario autenticado (con datos del concierto) */
export async function getUserCalendarEntries(): Promise<CalendarEntryWithConcert[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("calendar_entries")
    .select("*, concerts(id, name, date_time, venue_name, image_url, visibility)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CalendarEntryWithConcert[];
}

/** Añadir un concierto al calendario privado del usuario autenticado */
export async function addConcertToCalendar(concertId: string): Promise<Result<CalendarEntry>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data, error } = await supabase
    .from("calendar_entries")
    .insert({ user_id: user.id, concert_id: concertId })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

/** Eliminar la entrada de calendario que vincula al usuario con un concierto */
export async function removeConcertFromCalendar(concertId: string): Promise<Result<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("calendar_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("concert_id", concertId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/** Eliminar cualquier entrada del calendario por su id */
export async function deleteCalendarEntry(entryId: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_entries").delete().eq("id", entryId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/** Crear una entrada personal (sin concierto vinculado) */
export async function createPersonalEntry(payload: {
  title: string;
  description?: string;
  date_time: string;
}): Promise<Result<CalendarEntry>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data, error } = await supabase
    .from("calendar_entries")
    .insert({
      user_id: user.id,
      title: payload.title,
      description: payload.description ?? null,
      date_time: payload.date_time,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

/** Comprobar si el usuario autenticado tiene un concierto en su calendario */
export async function isConcertInCalendar(concertId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("calendar_entries")
    .select("id")
    .eq("user_id", user.id)
    .eq("concert_id", concertId)
    .maybeSingle();

  return data !== null;
}
