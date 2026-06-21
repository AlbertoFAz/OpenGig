"use client";

import { createContext, useContext, useState } from "react";
import { type Locale, type Translations, locales } from "@/i18n";

interface LocaleContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "es",
  t: locales.es,
  setLocale: () => undefined,
});

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "es";
  const saved = localStorage.getItem("locale");
  return saved === "es" || saved === "en" ? saved : "es";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  }

  return (
    <LocaleContext.Provider value={{ locale, t: locales[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
