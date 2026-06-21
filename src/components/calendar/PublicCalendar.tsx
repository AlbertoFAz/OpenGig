"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { es } from "@/i18n/es";
import type { Concert } from "@/lib/repositories/concerts";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: dateFnsEs }),
  getDay,
  locales: { es: dateFnsEs },
});

const MESSAGES = {
  today: es.calendar.today,
  previous: "Anterior",
  next: "Siguiente",
  month: es.calendar.month,
  week: es.calendar.week,
  day: es.calendar.day,
  noEventsInRange: es.calendar.noConcerts,
  showMore: (total: number) => `+${total} más`,
};

interface PublicCalendarProps {
  concerts?: Concert[];
}

export function PublicCalendar({ concerts = [] }: PublicCalendarProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  const events = concerts.map((c) => ({
    id: c.id,
    title: c.name,
    start: new Date(c.date_time),
    end: new Date(new Date(c.date_time).getTime() + 2 * 60 * 60 * 1000),
    resource: c,
  }));

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
