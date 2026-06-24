import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { concertServerSchema } from "@/lib/schemas/concert";

const patchBodySchema = concertServerSchema.partial().extend({
  artistIds: z.array(z.string().uuid()).min(1).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { artistIds, ...concertFields } = parsed.data;

  // Convertir undefined a null para campos nullable en Supabase
  const updatePayload = {
    ...(concertFields.name !== undefined && { name: concertFields.name }),
    ...(concertFields.description !== undefined && { description: concertFields.description }),
    ...(concertFields.date_time !== undefined && { date_time: concertFields.date_time }),
    ...(concertFields.venue_name !== undefined && { venue_name: concertFields.venue_name }),
    ...(concertFields.venue_address !== undefined && {
      venue_address: concertFields.venue_address,
    }),
    ...("image_url" in concertFields && { image_url: concertFields.image_url ?? null }),
    ...("ticket_url" in concertFields && { ticket_url: concertFields.ticket_url ?? null }),
    ...("price" in concertFields && { price: concertFields.price ?? null }),
    ...(concertFields.visibility !== undefined && { visibility: concertFields.visibility }),
    ...("venueId" in concertFields && { venue_id: concertFields.venueId ?? null }),
  };

  const { data, error } = await supabase
    .from("concerts")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Concierto no encontrado" }, { status: 404 });

  // Sincronizar artistas si se envían
  if (artistIds !== undefined) {
    await supabase.from("concert_artists").delete().eq("concert_id", id);
    if (artistIds.length > 0) {
      await supabase
        .from("concert_artists")
        .insert(artistIds.map((artistId) => ({ concert_id: id, artist_profile_id: artistId })));
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { error } = await supabase.from("concerts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
