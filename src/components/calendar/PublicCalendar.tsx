"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { Concert } from "@/lib/repositories/concerts";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: dateFnsEs }),
  getDay,
  locales: { es: dateFnsEs },
});

interface PublicCalendarProps {
  concerts?: Concert[];
}

export function PublicCalendar({ concerts = [] }: PublicCalendarProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [view, setView] = useState<View>("month");

  const MESSAGES = {
    today: t.calendar.today,
    previous: "Anterior",
    next: "Siguiente",
    month: t.calendar.month,
    week: t.calendar.week,
    day: t.calendar.day,
    noEventsInRange: t.calendar.noConcerts,
    showMore: (total: number) => `+${total} más`,
  };
  const [date, setDate] = useState(new Date());

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  const events = concerts.map((c) => {
    const start = new Date(c.date_time);
    // Limitar la duración visual a 90 min pero nunca cruzar medianoche,
    // para evitar que react-big-calendar trate el evento como multi-día.
    const candidate = new Date(start.getTime() + 90 * 60 * 1000);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 0);
    const end = candidate > endOfDay ? endOfDay : candidate;
    return { id: c.id, title: c.name, start, end, resource: c };
  });

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[500px]">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onNavigate={onNavigate}
        onView={onView}
        onSelectEvent={(event) => router.push(`/concerts/${event.id}`)}
        culture="es"
        messages={MESSAGES}
        className="rounded-lg border bg-background p-2"
      />
    </div>
  );
}
