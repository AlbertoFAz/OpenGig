"use client";

import { Download, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocale } from "@/components/providers/LocaleProvider";
import { googleCalendarUrl, type ConcertForIcs } from "@/lib/icalendar";

interface ExportConcertButtonsProps {
  concert: ConcertForIcs;
}

export function ExportConcertButtons({ concert }: ExportConcertButtonsProps) {
  const { t } = useLocale();
  const googleUrl = googleCalendarUrl(concert);

  return (
    <div className="pt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {t.export.sectionTitle}
      </p>
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/concerts/${concert.id}/export.ics`} download>
                <Download data-icon="inline-start" />
                {t.export.downloadIcs}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.concert.tooltipIcs}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" asChild>
              <a href={googleUrl} target="_blank" rel="noreferrer">
                <CalendarPlus data-icon="inline-start" />
                {t.export.openGoogleCalendar}
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t.concert.tooltipGoogle}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
