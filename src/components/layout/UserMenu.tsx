"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { es } from "@/i18n/es";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserMenuProps {
  user: SupabaseUser | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

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
          <Link href="/login">{es.auth.login}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/register">{es.auth.register}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted-foreground sm:block">{user.email}</span>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menú de usuario">
            <User className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Mi cuenta</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-2">
            <Button variant="ghost" className="justify-start gap-2" asChild>
              <Link href="/me/profile">
                <User className="h-4 w-4" />
                Mi perfil
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-2 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {es.auth.logout}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
