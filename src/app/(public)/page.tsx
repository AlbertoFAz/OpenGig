import { getFeaturedConcerts, getUpcomingConcerts } from "@/lib/repositories/concerts";
import { rankConcerts } from "@/lib/ranking";
import { PublicCalendar } from "@/components/calendar/PublicCalendar";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "OpenGig — Calendario de conciertos" };

export default async function HomePage() {
  const [upcomingConcerts, todayConcerts] = await Promise.all([
    getUpcomingConcerts(180),
    getFeaturedConcerts(),
  ]);

  const featured = rankConcerts(todayConcerts).slice(0, 6);

  return (
    <div className="grid gap-10">
      {/* Hero */}
      <div className="from-muted/40 to-background -mx-4 bg-gradient-to-b px-4 pb-8 pt-10 sm:mx-0 sm:rounded-2xl sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calendario de conciertos</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Descubre los próximos conciertos, guárdalos en tu calendario y sigue a tus artistas
          favoritos.
        </p>
      </div>

      {featured.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Próximos destacados</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((concert) => (
              <ConcertCard key={concert.id} concert={concert} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && <Separator />}

      <section>
        <h2 className="mb-5 text-xl font-semibold tracking-tight">Todos los conciertos</h2>
        <PublicCalendar concerts={upcomingConcerts} />
      </section>
    </div>
  );
}
