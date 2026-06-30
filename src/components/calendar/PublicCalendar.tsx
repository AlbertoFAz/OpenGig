"use client";

import { useState, useCallback, useMemo, type ComponentType } from "react";
import { Calendar, dateFnsLocalizer, type View, type ToolbarProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es as dateFnsEs, enUS as dateFnsEn } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { Music2 } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useLocale } from "@/components/providers/LocaleProvider";
import { CalendarToolbar } from "./CalendarToolbar";
import { ROLE_COLORS, type UserRole } from "@/lib/schemas/profile";
import type { ConcertWithCreator } from "@/lib/repositories/concerts";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ConcertWithCreator;
}

interface PublicCalendarProps {
  concerts?: ConcertWithCreator[];
}

function EventCard({ event }: { event: CalendarEvent }) {
  return (
    <div className="flex h-full items-center gap-1 overflow-hidden px-1.5">
      <Music2 className="size-2.5 shrink-0 opacity-60" />
      <span className="truncate text-[10.5px] font-semibold leading-none tracking-tight">
        {event.title}
      </span>
    </div>
  );
}

export function PublicCalendar({ concerts = [] }: PublicCalendarProps) {
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
      noEventsInRange: t.calendar.noConcerts,
      showMore: (total: number) => t.calendar.showMore.replace("{n}", String(total)),
    }),
    [t]
  );

  const onNavigate = useCallback((newDate: Date) => setDate(newDate), []);
  const onView = useCallback((newView: View) => setView(newView), []);

  const events: CalendarEvent[] = concerts.map((c) => {
    const start = new Date(c.date_time);
    const candidate = new Date(start.getTime() + 90 * 60 * 1000);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 0);
    const end = candidate > endOfDay ? endOfDay : candidate;
    return {
      id: c.id,
      title: c.name,
      start,
      end,
      resource: c,
    };
  });

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const role = (event.resource.profiles?.role ?? "USER") as UserRole;
    return {
      style: {
        backgroundColor: ROLE_COLORS[role],
        color: "#fff",
        border: "none",
      },
    };
  }, []);

  const COMPONENTS = useMemo(
    () => ({
      event: EventCard,
      toolbar: CalendarToolbar as ComponentType<ToolbarProps<CalendarEvent, object>>,
    }),
    []
  );

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[520px]">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onNavigate={onNavigate}
        onView={onView}
        onSelectEvent={(event) => router.push(`/concerts/${event.id}`)}
        culture={locale}
        messages={MESSAGES}
        eventPropGetter={eventPropGetter}
        components={COMPONENTS}
        className="rbc-redesign"
      />
    </div>
  );
}
