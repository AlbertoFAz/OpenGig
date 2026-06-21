"use client";

import { useState, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import { useRouter } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { es } from "@/i18n/es";
import type { CalendarEntryWithConcert } from "@/lib/repositories/calendar-entries";
import { CalendarEntryPanel } from "./CalendarEntryPanel";

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
  noEventsInRange: "No tienes entradas en este periodo.",
  showMore: (total: number) => `+${total} más`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEntryWithConcert;
}

interface PrivateCalendarProps {
  entries?: CalendarEntryWithConcert[];
}

export function PrivateCalendar({ entries = [] }: PrivateCalendarProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntryWithConcert | null>(null);

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  const events: CalendarEvent[] = entries.map((entry) => {
    // Si está vinculada a un concierto, la fecha viene del concierto
    const dt = entry.concerts?.date_time ?? entry.date_time;
    const start = dt ? new Date(dt) : new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const title = entry.concerts?.name ?? entry.title ?? "Entrada personal";

    return { id: entry.id, title, start, end, resource: entry };
  });

  // Azul para entradas vinculadas a concierto, naranja para personales
  const eventPropGetter = (event: CalendarEvent) => {
    const isConcertEntry = event.resource.concert_id !== null;
    return {
      style: {
        backgroundColor: isConcertEntry ? "#3b82f6" : "#f97316",
        borderColor: isConcertEntry ? "#2563eb" : "#ea580c",
        color: "#fff",
      },
    };
  };

  return (
    <>
      <div className="mb-4 flex gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          Conciertos guardados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
          Entradas personales
        </span>
      </div>

      <div className="h-[calc(100vh-14rem)] min-h-[500px]">
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onNavigate={onNavigate}
          onView={onView}
          onSelectEvent={(event) => {
            if (event.resource.concert_id) {
              router.push(`/concerts/${event.resource.concert_id}`);
            } else {
              setSelectedEntry(event.resource);
            }
          }}
          eventPropGetter={eventPropGetter}
          culture="es"
          messages={MESSAGES}
          className="rounded-lg border bg-background p-2"
        />
      </div>

      {selectedEntry && (
        <CalendarEntryPanel
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDeleted={() => {
            setSelectedEntry(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
