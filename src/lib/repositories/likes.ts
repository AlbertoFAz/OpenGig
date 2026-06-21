import { createClient } from "@/lib/supabase/server";
import type { Result } from "./concerts";

/** Comprobar si el usuario autenticado ha dado like a un concierto */
export async function hasLiked(concertId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("likes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("concert_id", concertId)
    .maybeSingle();

  return !!data;
}

/** Dar like a un concierto */
export async function likeConcert(concertId: string): Promise<Result<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("likes")
    .insert({ user_id: user.id, concert_id: concertId });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/** Quitar like de un concierto */
export async function unlikeConcert(concertId: string): Promise<Result<void>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("concert_id", concertId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
