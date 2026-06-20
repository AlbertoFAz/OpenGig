import { getUpcomingConcerts } from "@/lib/repositories/concerts";
import { PublicCalendar } from "@/components/calendar/PublicCalendar";

export const metadata = { title: "OpenGig — Calendario de conciertos" };

export default async function HomePage() {
  const concerts = await getUpcomingConcerts(180);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario de conciertos</h1>
        <p className="text-muted-foreground">Descubre los próximos conciertos en tu ciudad.</p>
      </div>
      <PublicCalendar concerts={concerts} />
    </div>
  );
}
