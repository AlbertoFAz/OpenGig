"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Notification } from "@/lib/repositories/notifications";
import { useRouter } from "next/navigation";

interface NotificationBellProps {
  initialNotifications: Notification[];
  initialUnread: number;
  userId: string;
}

const TYPE_ICONS: Record<string, string> = {
  PROMOTION_OFFER: "🌟",
  LIKE_RECEIVED: "❤️",
  CONCERT_UPDATED: "🎵",
};

export function NotificationBell({
  initialNotifications,
  initialUnread,
  userId,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Suscripción Realtime a notificaciones nuevas
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as Notification;
          setNotifications((prev) => [notif, ...prev].slice(0, 20));
          setUnread((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnread((prev) => Math.max(prev - 1, 0));
  }

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
    setUnread(0);
  }

  async function handleAcceptPromotion(notifId: string) {
    const supabase = createClient();
    await supabase.from("profiles").update({ role: "COLLABORATOR" }).eq("id", userId);
    await markRead(notifId);
    startTransition(() => router.refresh());
  }

  async function handleRejectPromotion(notifId: string) {
    const supabase = createClient();
    // Registrar rechazo en promotion_logs
    await supabase
      .from("promotion_logs")
      .update({ rejected_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("rejected_at", null);
    await markRead(notifId);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">Notificaciones</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">
            No tienes notificaciones.
          </p>
        ) : (
          <ul className="max-h-96 overflow-y-auto divide-y">
            {notifications.map((n) => (
              <li key={n.id} className={`px-4 py-3 ${!n.read_at ? "bg-muted/50" : ""}`}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{n.message}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>

                    {/* Botones de acción para oferta de promoción */}
                    {n.type === "PROMOTION_OFFER" && !n.read_at && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleAcceptPromotion(n.id)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleRejectPromotion(n.id)}
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>

                  {!n.read_at && n.type !== "PROMOTION_OFFER" && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 text-xs"
                      aria-label="Marcar como leída"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
