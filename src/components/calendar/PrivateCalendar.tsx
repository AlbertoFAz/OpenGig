"use client";

import { useState, useCallback, useMemo, type ComponentType } from "react";
import { Calendar, dateFnsLocalizer, type View, type ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs, enUS as dateFnsEn } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Music2, StickyNote } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useLocale } from "@/components/providers/LocaleProvider";
import { CalendarToolbar } from "./CalendarToolbar";
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
        <StickyNote className="size-2.5 shrink-0 opacity-60" />
      ) : (
        <Music2 className="size-2.5 shrink-0 opacity-60" />
      )}
      <span className="truncate text-[10.5px] font-semibold leading-none tracking-tight">
        {event.title}
      </span>
    </div>
  );
}

/* Paleta semántica para cada tipo de entrada */
const EVENT_COLORS = {
  mine: { bg: "oklch(0.6 0.17 145)", border: "oklch(0.5 0.17 145)" },
  saved: { bg: "oklch(0.58 0.18 270)", border: "oklch(0.48 0.18 270)" },
  personal: { bg: "oklch(0.65 0.16 35)", border: "oklch(0.55 0.16 35)" },
} as const;

export function PrivateCalendar({ entries = [], userId }: PrivateCalendarProps) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntryWithConcert | null>(null);

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

  const eventPropGetter = useCallback(
    (event: CalendarEvent) => {
      const { concert_id, concerts } = event.resource;
      const colors = !concert_id
        ? EVENT_COLORS.personal
        : concerts?.created_by === userId
          ? EVENT_COLORS.mine
          : EVENT_COLORS.saved;
      return {
        style: { backgroundColor: colors.bg, borderColor: colors.border, color: "#fff" },
      };
    },
    [userId]
  );

  const COMPONENTS = useMemo(
    () => ({
      event: EventCard,
      toolbar: CalendarToolbar as ComponentType<ToolbarProps<CalendarEvent, object>>,
    }),
    []
  );

  return (
    <>
      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: EVENT_COLORS.mine.bg }} />
          {t.calendar.myEvents}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: EVENT_COLORS.saved.bg }}
          />
          {t.calendar.savedEvents}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: EVENT_COLORS.personal.bg }}
          />
          {t.calendar.personalEntries}
        </span>
      </div>

      <div className="h-[calc(100vh-14rem)] min-h-[520px]">
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
          className="rbc-redesign"
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
