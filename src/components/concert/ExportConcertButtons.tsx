"use client";

import { Download, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/LocaleProvider";
import { googleCalendarUrl, type ConcertForIcs } from "@/lib/icalendar";

interface ExportConcertButtonsProps {
  concert: ConcertForIcs;
}

export function ExportConcertButtons({ concert }: ExportConcertButtonsProps) {
  const { t } = useLocale();
  const googleUrl = googleCalendarUrl(concert);

  return (
    <div className="mt-6 border-t pt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
        {t.export.sectionTitle}
      </h2>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/api/concerts/${concert.id}/export.ics`} download>
            <Download size={15} className="mr-1.5" />
            {t.export.downloadIcs}
          </a>
        </Button>

        <Button variant="outline" size="sm" asChild>
          <a href={googleUrl} target="_blank" rel="noreferrer">
            <CalendarPlus size={15} className="mr-1.5" />
            {t.export.openGoogleCalendar}
          </a>
        </Button>
      </div>
    </div>
  );
}
