"use client";

import dynamic from "next/dynamic";
import type { CalendarEntryWithConcert } from "@/lib/repositories/calendar-entries";

// ssr: false solo puede usarse en Client Components (App Router).
// Este wrapper permite que el Server Component de la página lo importe
// sin violar esa restricción.
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
