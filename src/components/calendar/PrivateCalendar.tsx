"use client";

import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs, enUS as dateFnsEn } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Music2, StickyNote } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { CalendarEntryWithConcert } from "@/lib/repositories/calendar-entries";
import { CalendarEntryPanel } from "./CalendarEntryPanel";

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

function EventCard({ event }: { event: CalendarEvent }) {
  const isPersonal = !event.resource.concert_id;
  return (
    <div className="flex h-full items-center gap-1 overflow-hidden px-1.5">
      {isPersonal ? (
        <StickyNote className="size-3 shrink-0 opacity-70" />
      ) : (
        <Music2 className="size-3 shrink-0 opacity-70" />
      )}
      <span className="truncate text-[11px] font-semibold leading-none">{event.title}</span>
    </div>
  );
}

export function PrivateCalendar({ entries = [], userId }: PrivateCalendarProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const dateFnsLocale = locale === "en" ? dateFnsEn : dateFnsEs;

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format,
        parse,
        startOfWeek: () => startOfWeek(new Date(), { locale: dateFnsLocale }),
        getDay,
        locales: { es: dateFnsEs, en: dateFnsEn },
      }),
    [dateFnsLocale]
  );

  const MESSAGES = useMemo(
    () => ({
      today: t.calendar.today,
      previous: t.calendar.previous,
      next: t.calendar.next,
      month: t.calendar.month,
      week: t.calendar.week,
      day: t.calendar.day,
      agenda: t.calendar.agenda,
      noEventsInRange: t.calendar.noEntries,
      showMore: (total: number) => t.calendar.showMore.replace("{n}", String(total)),
    }),
    [t]
  );

  const [selectedEntry, setSelectedEntry] = useState<CalendarEntryWithConcert | null>(null);

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  const events: CalendarEvent[] = entries.map((entry) => {
    const dt = entry.concerts?.date_time ?? entry.date_time;
    const start = dt ? new Date(dt) : new Date();
    const candidate = new Date(start.getTime() + 90 * 60 * 1000);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 0);
    const end = candidate > endOfDay ? endOfDay : candidate;
    const title = entry.concerts?.name ?? entry.title ?? t.calendar.personalEntry;

    return { id: entry.id, title, start, end, resource: entry };
  });

  const eventPropGetter = (event: CalendarEvent) => {
    const { concert_id, concerts } = event.resource;
    let bg: string;
    let border: string;
    if (!concert_id) {
      bg = "#f97316";
      border = "#ea580c";
    } else if (concerts?.created_by === userId) {
      bg = "#22c55e";
      border = "#16a34a";
    } else {
      bg = "#3b82f6";
      border = "#2563eb";
    }
    return { style: { backgroundColor: bg, borderColor: border, color: "#fff" } };
  };

  const COMPONENTS = useMemo(
    () => ({
      event: EventCard,
    }),
    []
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-500" />
          {t.calendar.myEvents}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          {t.calendar.savedEvents}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
          {t.calendar.personalEntries}
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
          culture={locale}
          messages={MESSAGES}
          components={COMPONENTS}
          className="rounded-xl border bg-background p-2"
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
