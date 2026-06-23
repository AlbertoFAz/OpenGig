import { NextResponse } from "next/server";
import { getConcertById } from "@/lib/repositories/concerts";
import { concertsToIcsCalendar } from "@/lib/icalendar";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  const result = await getConcertById(id);
  if (!result.ok) {
    return NextResponse.json({ error: "Concierto no encontrado" }, { status: 404 });
  }

  const concert = result.data;
  if (concert.visibility !== "PUBLIC") {
    return NextResponse.json({ error: "Concierto no disponible" }, { status: 403 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://opengig.app";
  const icsResult = concertsToIcsCalendar([concert], baseUrl);
  if (!icsResult.ok) {
    return NextResponse.json({ error: icsResult.error }, { status: 500 });
  }

  const filename = encodeURIComponent(concert.name.replace(/\s+/g, "-").toLowerCase());
  return new NextResponse(icsResult.value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
      "Cache-Control": "no-cache",
    },
  });
}
