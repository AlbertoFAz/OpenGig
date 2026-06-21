import { Suspense } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Music2 } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { NotificationBellWrapper } from "./NotificationBellWrapper";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Music2 className="h-5 w-5" />
          <span>OpenGig</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Calendario
          </Link>
          {user && (
            <>
              <Link
                href="/me/calendar"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Mi calendario
              </Link>
              <Link
                href="/concerts/new"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Publicar concierto
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1">
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
