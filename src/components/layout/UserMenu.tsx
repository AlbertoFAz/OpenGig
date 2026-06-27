"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, UserRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/RoleBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { UserRole } from "@/lib/schemas/profile";

interface UserMenuProps {
  user: SupabaseUser | null;
  role?: string | null;
}

export function UserMenu({ user, role }: UserMenuProps) {
  const router = useRouter();
  const { t } = useLocale();

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild size="sm">
          <Link href="/login">{t.auth.login}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">{t.auth.register}</Link>
        </Button>
      </div>
    );
  }

  const initials = (user.email ?? "U").slice(0, 2).toUpperCase();
  const userRole = (role ?? "USER") as UserRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t.user.menuLabel}>
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <RoleBadge role={userRole} size={16} />
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/me/profile" className="cursor-pointer">
            <UserRound data-icon="inline-start" />
            {t.user.myProfile}
          </Link>
        </DropdownMenuItem>
        {role === "ADMIN" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="cursor-pointer">
                <ShieldAlert data-icon="inline-start" />
                Panel de administración
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut data-icon="inline-start" />
          {t.auth.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
