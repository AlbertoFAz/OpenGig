import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ concertId: string }>;
}

/** POST — guarda un concierto en el calendario privado */
export async function POST(_request: Request, ctx: RouteContext) {
  const { concertId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("calendar_entries")
    .insert({ user_id: user.id, concert_id: concertId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

/** DELETE — elimina la entrada que vincula al usuario con el concierto */
export async function DELETE(_request: Request, ctx: RouteContext) {
  const { concertId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { error } = await supabase
    .from("calendar_entries")
    .delete()
    .eq("user_id", user.id)
    .eq("concert_id", concertId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return new NextResponse(null, { status: 204 });
}
