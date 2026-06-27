import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** POST /api/concerts/[id]/endorse
 * Avala el concierto como artista vinculado o como sala (venue).
 * body: { as: "artist" | "venue" }
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id: concertId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await request.json()) as { as?: string };

  if (body.as === "artist") {
    // Marcar endorsed_at en concert_artists para este artista
    const { error } = await supabase
      .from("concert_artists")
      .update({ endorsed_at: new Date().toISOString() })
      .eq("concert_id", concertId)
      .eq("artist_profile_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (body.as === "venue") {
    // Verificar que el usuario es la sala del concierto
    const { data: concert } = await supabase
      .from("concerts")
      .select("venue_id")
      .eq("id", concertId)
      .single();

    if (!concert || concert.venue_id !== user.id) {
      return NextResponse.json({ error: "No eres la sala de este concierto" }, { status: 403 });
    }

    const { error } = await supabase
      .from("concerts")
      .update({ venue_endorsed_at: new Date().toISOString() })
      .eq("id", concertId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: "Tipo de aval inválido" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
