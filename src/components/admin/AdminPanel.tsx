"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle, Trash2, ShieldAlert, Users, Music } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { ROLE_LABELS, type UserRole } from "@/lib/schemas/profile";

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  prestige?: number;
}

interface ConcertRow {
  id: string;
  name: string;
  venue_name: string;
  date_time: string;
  visibility: string;
  created_at: string;
  profiles: { display_name: string; username: string; role: string } | null;
}

interface AdminPanelProps {
  pendingUsers: UserRow[];
  allUsers: UserRow[];
  recentConcerts: ConcertRow[];
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") return <Badge className="bg-emerald-600 text-white">Activo</Badge>;
  if (status === "PENDING") return <Badge className="bg-amber-500 text-white">Pendiente</Badge>;
  return <Badge variant="destructive">Bloqueado</Badge>;
}

export function AdminPanel({ pendingUsers, allUsers, recentConcerts }: AdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"pending" | "users" | "concerts">("pending");

  async function setUserStatus(userId: string, status: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Error al actualizar el estado");
      return;
    }
    toast.success(
      status === "ACTIVE"
        ? "Cuenta aprobada"
        : status === "BLOCKED"
          ? "Cuenta bloqueada"
          : "Estado actualizado"
    );
    startTransition(() => router.refresh());
  }

  async function deleteUser(userId: string, displayName: string) {
    if (
      !confirm(
        `¿Eliminar definitivamente al usuario "${displayName}"? Esta acción no se puede deshacer.`
      )
    )
      return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar el usuario");
      return;
    }
    toast.success("Usuario eliminado");
    startTransition(() => router.refresh());
  }

  async function deleteConcert(concertId: string, name: string) {
    if (!confirm(`¿Eliminar el concierto "${name}"?`)) return;
    const res = await fetch(`/api/admin/concerts/${concertId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar el concierto");
      return;
    }
    toast.success("Concierto eliminado");
    startTransition(() => router.refresh());
  }

  const tabs = [
    { key: "pending" as const, label: "Pendientes", count: pendingUsers.length, icon: ShieldAlert },
    { key: "users" as const, label: "Usuarios", count: allUsers.length, icon: Users },
    { key: "concerts" as const, label: "Conciertos", count: recentConcerts.length, icon: Music },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de administración</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestión de usuarios y contenido</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
            {count > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold leading-none ${
                  key === "pending" && count > 0
                    ? "bg-amber-500 text-white"
                    : "bg-muted-foreground/20"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <Separator />

      {/* Pendientes */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No hay cuentas pendientes de aprobación.
            </p>
          ) : (
            pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <RoleBadge role={u.role as UserRole} size={24} />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      @{u.username} · {ROLE_LABELS[u.role as UserRole] ?? u.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registro: {format(new Date(u.created_at), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => setUserStatus(u.id, "ACTIVE")}
                    disabled={isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="size-4 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteUser(u.id, u.display_name)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Rechazar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Todos los usuarios */}
      {activeTab === "users" && (
        <div className="space-y-2">
          {allUsers.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-4 rounded-xl border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <RoleBadge role={u.role as UserRole} size={20} />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    @{u.username} · {ROLE_LABELS[u.role as UserRole] ?? u.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={u.status} />
                {u.status === "ACTIVE" && u.role !== "ADMIN" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUserStatus(u.id, "BLOCKED")}
                    disabled={isPending}
                  >
                    <XCircle className="size-3.5 mr-1" />
                    Bloquear
                  </Button>
                )}
                {u.status === "BLOCKED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUserStatus(u.id, "ACTIVE")}
                    disabled={isPending}
                  >
                    <CheckCircle className="size-3.5 mr-1" />
                    Desbloquear
                  </Button>
                )}
                {u.role !== "ADMIN" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteUser(u.id, u.display_name)}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conciertos recientes */}
      {activeTab === "concerts" && (
        <div className="space-y-2">
          {recentConcerts.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-4 rounded-xl border p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.venue_name} · {format(new Date(c.date_time), "d MMM yyyy", { locale: es })}
                </p>
                {c.profiles && (
                  <p className="text-xs text-muted-foreground">
                    Por {c.profiles.display_name} (@{c.profiles.username})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.visibility === "PUBLIC" ? "default" : "secondary"}>
                  {c.visibility === "PUBLIC" ? "Público" : "Privado"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteConcert(c.id, c.name)}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
