import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { concertServerSchema } from "@/lib/schemas/concert";

const bodySchema = concertServerSchema.extend({
  artistIds: z.array(z.string().uuid()).default([]),
  artistFreeNames: z.array(z.string().min(1).max(200)).default([]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const {
    image_url,
    ticket_url,
    price,
    description,
    venue_address,
    visibility,
    venueId,
    artistIds,
    artistFreeNames,
    ...required
  } = parsed.data;

  const { data, error } = await supabase
    .from("concerts")
    .insert({
      ...required,
      created_by: user.id,
      description: description ?? "",
      venue_address: venue_address ?? "",
      image_url: image_url ?? null,
      ticket_url: ticket_url ?? null,
      price: price ?? null,
      visibility: visibility ?? "PUBLIC",
      venue_id: venueId ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-añadir el concierto al calendario del creador
  await supabase.from("calendar_entries").insert({ user_id: user.id, concert_id: data.id });

  // Vincular artistas registrados
  if (artistIds.length > 0) {
    await supabase
      .from("concert_artists")
      .insert(artistIds.map((artistId) => ({ concert_id: data.id, artist_profile_id: artistId })));
  }

  // Vincular artistas no registrados (texto libre)
  if (artistFreeNames.length > 0) {
    await supabase
      .from("concert_artists")
      .insert(artistFreeNames.map((name) => ({ concert_id: data.id, artist_name: name })));
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
