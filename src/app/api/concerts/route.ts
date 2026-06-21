import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { concertServerSchema } from "@/lib/schemas/concert";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = concertServerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { image_url, ticket_url, price, description, venue_address, visibility, ...required } =
    parsed.data;

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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
