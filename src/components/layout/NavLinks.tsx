"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

interface NavLinksProps {
  authenticated: boolean;
}

export function NavLinks({ authenticated }: NavLinksProps) {
  const { t } = useLocale();

  return (
    <nav className="hidden items-center gap-6 text-sm md:flex">
      <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
        {t.nav.calendar}
      </Link>
      {authenticated && (
        <>
          <Link
            href="/me/calendar"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.nav.myCalendar}
          </Link>
          <Link
            href="/concerts/new"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.nav.publishConcert}
          </Link>
        </>
      )}
    </nav>
  );
}
