"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export function CalendarPageHeader() {
  const { t } = useLocale();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{t.pages.myCalendarTitle}</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">{t.pages.myCalendarDesc}</p>
    </div>
  );
}
