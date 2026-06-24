import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface VenueOption {
  type: "profile" | "text";
  id?: string;
  name: string;
  username?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const supabase = await createClient();

  if (!q) {
    // Sin query: salas registradas más populares
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("role", "VENUE")
      .order("prestige", { ascending: false })
      .limit(6);

    const results: VenueOption[] = (profiles ?? []).map((p) => ({
      type: "profile",
      id: p.id,
      name: p.display_name,
      username: p.username,
    }));
    return NextResponse.json(results);
  }

  // Buscar salas registradas (perfiles VENUE)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("role", "VENUE")
    .ilike("display_name", `%${q}%`)
    .limit(5);

  // Buscar nombres de sala usados anteriormente en conciertos
  const { data: concertVenues } = await supabase
    .from("concerts")
    .select("venue_name")
    .ilike("venue_name", `%${q}%`)
    .limit(10);

  const profileNames = new Set((profiles ?? []).map((p) => p.display_name.toLowerCase()));

  // Nombres únicos de salas anteriores que no coincidan con perfiles
  const textVenues = [...new Set((concertVenues ?? []).map((c) => c.venue_name))]
    .filter((name) => !profileNames.has(name.toLowerCase()))
    .slice(0, 5);

  const results: VenueOption[] = [
    ...(profiles ?? []).map(
      (p): VenueOption => ({
        type: "profile",
        id: p.id,
        name: p.display_name,
        username: p.username,
      })
    ),
    ...textVenues.map(
      (name): VenueOption => ({
        type: "text",
        name,
      })
    ),
  ];

  return NextResponse.json(results);
}
