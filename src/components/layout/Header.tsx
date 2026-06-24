import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { UserMenu } from "./UserMenu";
import { NavLinks } from "./NavLinks";
import { NotificationBellWrapper } from "./NotificationBellWrapper";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/logo-light.svg"
            alt="OpenGig"
            width={96}
            height={96}
            className="dark:hidden"
            priority
          />
          <Image
            src="/logo-dark.svg"
            alt="OpenGig"
            width={96}
            height={96}
            className="hidden dark:block"
            priority
          />
        </Link>

        <NavLinks authenticated={!!user} />

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          {user && (
            <Suspense fallback={null}>
              <NotificationBellWrapper userId={user.id} />
            </Suspense>
          )}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
