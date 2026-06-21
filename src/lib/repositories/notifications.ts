import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import type { Result } from "./concerts";

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

/** Obtener las últimas 20 notificaciones del usuario autenticado */
export async function getMyNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

/** Marcar una notificación como leída */
export async function markNotificationRead(notificationId: string): Promise<Result<void>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

/** Contar notificaciones no leídas */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}
