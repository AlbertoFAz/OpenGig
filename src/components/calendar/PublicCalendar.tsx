"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { es } from "@/i18n/es";

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: unknown;
}

interface PublicCalendarProps {
  events?: CalendarEvent[];
}

export function PublicCalendar({ events = [] }: PublicCalendarProps) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[500px]">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onNavigate={onNavigate}
        onView={onView}
        culture="es"
        messages={MESSAGES}
        className="rounded-lg border bg-background p-2"
      />
    </div>
  );
}
