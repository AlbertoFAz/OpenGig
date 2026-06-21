import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { personalEntrySchema } from "@/lib/schemas/concert";

/** POST — crea una entrada personal en el calendario privado */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = personalEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("calendar_entries")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      date_time: new Date(parsed.data.date_time).toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
