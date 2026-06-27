import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata = { title: "Panel de administración — OpenGig" };

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: pendingUsers }, { data: allUsers }, { data: recentConcerts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, role, status, created_at")
      .eq("status", "PENDING")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, username, display_name, role, status, created_at, prestige")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("concerts")
      .select(
        "id, name, venue_name, date_time, visibility, created_at, profiles!created_by(display_name, username, role)"
      )
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <AdminPanel
      pendingUsers={pendingUsers ?? []}
      allUsers={allUsers ?? []}
      recentConcerts={(recentConcerts ?? []) as Parameters<typeof AdminPanel>[0]["recentConcerts"]}
    />
  );
}
