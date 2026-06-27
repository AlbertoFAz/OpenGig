import Image from "next/image";
import type { UserRole } from "@/lib/schemas/profile";

const BADGE_ICON: Record<UserRole, string> = {
  USER: "/badge_fan_icono.svg",
  ARTIST: "/badge_artista_icono.svg",
  VENUE: "/badge_sala_icono.svg",
  COLLABORATOR: "/badge_colaborador_icono.svg",
  ADMIN: "/badge_artista_icono.svg", // fallback hasta tener badge de admin
};

const BADGE_LABEL: Record<UserRole, string> = {
  USER: "/badge_fan_etiqueta.svg",
  ARTIST: "/badge_artista_etiqueta.svg",
  VENUE: "/badge_sala_etiqueta.svg",
  COLLABORATOR: "/badge_colaborador_etiqueta.svg",
  ADMIN: "/badge_artista_etiqueta.svg",
};

interface RoleBadgeProps {
  role: UserRole;
  variant?: "icon" | "label";
  size?: number;
  className?: string;
}

export function RoleBadge({ role, variant = "icon", size = 20, className }: RoleBadgeProps) {
  const src = variant === "label" ? BADGE_LABEL[role] : BADGE_ICON[role];
  const alt = role;
  return <Image src={src} alt={alt} width={size} height={size} className={className} unoptimized />;
}
