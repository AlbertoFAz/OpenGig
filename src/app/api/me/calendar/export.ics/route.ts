import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { concertsToIcsCalendar, type ConcertForIcs } from "@/lib/icalendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Buscar el perfil cuyo token coincide
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("calendar_subscription_token", token)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  // Obtener entradas del calendario del usuario (con datos del concierto)
  const { data: entries } = await supabase
    .from("calendar_entries")
    .select(
      "id, title, description, date_time, concerts(id, name, description, date_time, venue_name, venue_address, ticket_url, image_url, visibility)"
    )
    .eq("user_id", profile.id);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://opengig.app";

  const concerts: ConcertForIcs[] = (entries ?? []).map((entry) => {
    const c = entry.concerts;
    if (c) {
      return {
        id: `entry-${entry.id}`,
        name: c.name,
        description: c.description ?? "",
        date_time: c.date_time,
        venue_name: c.venue_name,
        venue_address: c.venue_address ?? "",
        ticket_url: c.ticket_url,
        image_url: c.image_url,
      };
    }
    return {
      id: `entry-${entry.id}`,
      name: entry.title ?? "Entrada personal",
      description: entry.description ?? "",
      date_time: entry.date_time ?? new Date().toISOString(),
      venue_name: "",
      venue_address: "",
      ticket_url: null,
      image_url: null,
    };
  });

  const icsResult = concertsToIcsCalendar(concerts, baseUrl);
  if (!icsResult.ok) {
    return NextResponse.json({ error: icsResult.error }, { status: 500 });
  }

  const calName = encodeURIComponent(profile.display_name ?? "mi-calendario");
  return new NextResponse(icsResult.value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${calName}.ics"`,
      "Cache-Control": "no-cache, no-store",
    },
  });
}
