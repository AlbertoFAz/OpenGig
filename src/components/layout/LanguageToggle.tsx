"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { LOCALE_LABELS, type Locale } from "@/i18n";
import { Button } from "@/components/ui/button";

const LOCALES: Locale[] = ["es", "en"];

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const next = LOCALES.find((l) => l !== locale) ?? "es";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-10 px-0 font-medium"
      onClick={() => setLocale(next)}
      aria-label={`Cambiar idioma a ${LOCALE_LABELS[next]}`}
    >
      {LOCALE_LABELS[locale]}
    </Button>
  );
}
