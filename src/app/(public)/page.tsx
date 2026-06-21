import { getFeaturedConcerts, getUpcomingConcerts } from "@/lib/repositories/concerts";
import { rankConcerts } from "@/lib/ranking";
import { PublicCalendar } from "@/components/calendar/PublicCalendar";
import { ConcertCard } from "@/components/concert/ConcertCard";

export const metadata = { title: "OpenGig — Calendario de conciertos" };

export default async function HomePage() {
  const [upcomingConcerts, todayConcerts] = await Promise.all([
    getUpcomingConcerts(180),
    getFeaturedConcerts(),
  ]);

  const featured = rankConcerts(todayConcerts).slice(0, 10);

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-2xl font-bold">Calendario de conciertos</h1>
        <p className="text-muted-foreground">Descubre los próximos conciertos en tu ciudad.</p>
      </div>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Próximos destacados</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        </section>
      )}

      <PublicCalendar concerts={upcomingConcerts} />
    </div>
  );
}
