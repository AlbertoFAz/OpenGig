"use client";

import dynamic from "next/dynamic";
import type { CalendarEntryWithConcert } from "@/lib/repositories/calendar-entries";

// Cargamos PrivateCalendar sin SSR para que react-big-calendar no bloquee el
// hilo principal durante la hidratación inicial. El logo del header (priority)
// puede pintarse antes de que el calendario esté listo → LCP mejora.
const PrivateCalendar = dynamic(
  () =>
    import("@/components/calendar/PrivateCalendar").then((m) => ({
      default: m.PrivateCalendar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-14rem)] min-h-[520px] animate-pulse rounded-2xl bg-muted/40" />
    ),
  }
);

interface PrivateCalendarLazyProps {
  entries: CalendarEntryWithConcert[];
  userId: string;
}

export function PrivateCalendarLazy({ entries, userId }: PrivateCalendarLazyProps) {
  return <PrivateCalendar entries={entries} userId={userId} />;
}
