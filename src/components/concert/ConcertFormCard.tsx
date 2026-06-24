"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConcertForm } from "@/components/concert/ConcertForm";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { ConcertInput } from "@/lib/schemas/concert";
import type { UserRole } from "@/lib/schemas/profile";

const VALID_ROLES: UserRole[] = ["USER", "ARTIST", "VENUE", "COLLABORATOR"];

function toUserRole(role: string): UserRole {
  return VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : "USER";
}

interface ConcertFormCardProps {
  mode: "new" | "edit";
  userRole?: string;
  defaultValues?: Partial<ConcertInput> & {
    id?: string;
    image_url?: string;
    artistIds?: string[];
  };
}

export function ConcertFormCard({ mode, userRole = "USER", defaultValues }: ConcertFormCardProps) {
  const { t } = useLocale();
  const isPublicOnly = userRole === "ARTIST" || userRole === "VENUE";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "new" ? t.concert.publishTitle : t.concert.editTitle}</CardTitle>
        <CardDescription>
          {mode === "new"
            ? isPublicOnly
              ? t.concert.publishHintPublic
              : t.concert.publishHintDefault
            : t.concert.editDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConcertForm
          userRole={toUserRole(userRole)}
          {...(defaultValues !== undefined ? { defaultValues } : {})}
        />
      </CardContent>
    </Card>
  );
}
