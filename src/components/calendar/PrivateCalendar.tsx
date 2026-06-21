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
  userId?: string;
}

export function PrivateCalendar({ entries = [], userId }: PrivateCalendarProps) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntryWithConcert | null>(null);

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  const events: CalendarEvent[] = entries.map((entry) => {
    const dt = entry.concerts?.date_time ?? entry.date_time;
    const start = dt ? new Date(dt) : new Date();
    // Limitar duración a 90 min sin cruzar medianoche
    const candidate = new Date(start.getTime() + 90 * 60 * 1000);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 0);
    const end = candidate > endOfDay ? endOfDay : candidate;
    const title = entry.concerts?.name ?? entry.title ?? "Entrada personal";

    return { id: entry.id, title, start, end, resource: entry };
  });

  // Verde = concierto propio, azul = concierto guardado ajeno, naranja = entrada personal
  const eventPropGetter = (event: CalendarEvent) => {
    const { concert_id, concerts } = event.resource;
    let bg: string;
    let border: string;
    if (!concert_id) {
      bg = "#f97316";
      border = "#ea580c"; // naranja — entrada personal
    } else if (concerts?.created_by === userId) {
      bg = "#22c55e";
      border = "#16a34a"; // verde — concierto propio
    } else {
      bg = "#3b82f6";
      border = "#2563eb"; // azul — concierto guardado
    }
    return { style: { backgroundColor: bg, borderColor: border, color: "#fff" } };
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          Mis conciertos
        </span>
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
