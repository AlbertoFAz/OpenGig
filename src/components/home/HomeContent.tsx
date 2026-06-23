"use client";

import { Separator } from "@/components/ui/separator";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { PublicCalendar } from "@/components/calendar/PublicCalendar";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Concert } from "@/lib/repositories/concerts";

interface HomeContentProps {
  featured: Concert[];
  upcoming: Concert[];
}

export function HomeContent({ featured, upcoming }: HomeContentProps) {
  const { t } = useLocale();

  return (
    <div className="grid gap-10">
      <div className="from-muted/40 to-background -mx-4 bg-gradient-to-b px-4 pb-8 pt-10 sm:mx-0 sm:rounded-2xl sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.home.heroTitle}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t.home.heroDesc}</p>
      </div>

      {featured.length > 0 && (
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">{t.home.featuredTitle}</h2>
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
        <h2 className="mb-5 text-xl font-semibold tracking-tight">{t.home.allConcerts}</h2>
        <PublicCalendar concerts={upcoming} />
      </section>
    </div>
  );
}
