"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NavigateAction, View } from "react-big-calendar";

interface CalendarToolbarProps {
  view: View;
  label: string;
  onNavigate: (action: NavigateAction) => void;
  onView: (view: View) => void;
}
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";

const VIEW_KEYS: View[] = ["month", "week", "day"];

export function CalendarToolbar({ view, onNavigate, onView, label }: CalendarToolbarProps) {
  const { t } = useLocale();

  const viewLabels: Record<string, string> = {
    month: t.calendar.month,
    week: t.calendar.week,
    day: t.calendar.day,
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-0.5">
      {/* Navegación */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onNavigate("PREV")}
          aria-label={t.calendar.previous}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={() => onNavigate("NEXT")}
          aria-label={t.calendar.next}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => onNavigate("TODAY")}
          className="ml-1 h-7 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {t.calendar.today}
        </button>
      </div>

      {/* Período actual */}
      <h2 className="order-first w-full text-center text-[0.9rem] font-semibold capitalize tracking-tight sm:order-none sm:w-auto sm:text-base">
        {label}
      </h2>

      {/* Segmented control de vista */}
      <div className="flex items-center gap-px rounded-lg bg-muted p-0.5">
        {VIEW_KEYS.map((v) => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={cn(
              "h-7 rounded-md px-3 text-xs font-medium transition-all duration-150",
              view === v
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {viewLabels[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
