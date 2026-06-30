"use client";

import { Separator } from "@/components/ui/separator";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { PublicCalendar } from "@/components/calendar/PublicCalendar";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { ConcertWithCreator } from "@/lib/repositories/concerts";

interface HomeContentProps {
  featured: ConcertWithCreator[];
  upcoming: ConcertWithCreator[];
}

export function HomeContent({ featured, upcoming }: HomeContentProps) {
  const { t } = useLocale();

  return (
    <div className="grid gap-12">
      {/* Hero */}
      <div className="from-muted/40 to-background -mx-4 bg-gradient-to-b px-4 pb-8 pt-10 sm:mx-0 sm:rounded-2xl sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.home.heroTitle}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t.home.heroDesc}</p>
      </div>

      {/* Top 10 por popularidad */}
      {featured.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-bold tracking-tight">{t.home.featuredTitle}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {featured.map((concert, index) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                creator={concert.profiles}
                endorsements={{
                  artistCount: concert.endorsed_artist_count ?? 0,
                  venueEndorsed: !!concert.venue_endorsed_at,
                }}
                priority={index < 2}
              />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && <Separator />}

      {/* Calendario público */}
      <section>
        <h2 className="mb-6 text-xl font-bold tracking-tight">{t.home.allConcerts}</h2>
        <PublicCalendar concerts={upcoming} />
      </section>
    </div>
  );
}
