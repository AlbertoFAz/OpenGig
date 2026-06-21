import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { concertServerSchema } from "@/lib/schemas/concert";

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
  const parsed = concertServerSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  // Convertir undefined a null para campos nullable en Supabase
  const updatePayload = {
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    ...(parsed.data.date_time !== undefined && { date_time: parsed.data.date_time }),
    ...(parsed.data.venue_name !== undefined && { venue_name: parsed.data.venue_name }),
    ...(parsed.data.venue_address !== undefined && { venue_address: parsed.data.venue_address }),
    ...("image_url" in parsed.data && { image_url: parsed.data.image_url ?? null }),
    ...("ticket_url" in parsed.data && { ticket_url: parsed.data.ticket_url ?? null }),
    ...("price" in parsed.data && { price: parsed.data.price ?? null }),
  };

  const { data, error } = await supabase
    .from("concerts")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Concierto no encontrado" }, { status: 404 });
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
