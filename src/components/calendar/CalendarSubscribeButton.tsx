"use client";

import { useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/LocaleProvider";
import { createClient } from "@/lib/supabase/client";

interface CalendarSubscribeButtonProps {
  initialToken: string;
}

export function CalendarSubscribeButton({ initialToken }: CalendarSubscribeButtonProps) {
  const { t } = useLocale();
  const [token, setToken] = useState(initialToken);
  const [regenerating, setRegenerating] = useState(false);

  // En servidor window no existe → URL relativa; en cliente → URL absoluta con origin.
  // suppressHydrationWarning en los elementos que muestran esta URL evita el error #418.
  const subscribeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/me/calendar/export.ics?token=${token}`
      : `/api/me/calendar/export.ics?token=${token}`;

  const webcalUrl = subscribeUrl.replace(/^https?:\/\//, "webcal://");

  async function copyUrl() {
    await navigator.clipboard.writeText(subscribeUrl);
    toast.success(t.export.subscribeCopied);
  }

  async function regenerateToken() {
    setRegenerating(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setRegenerating(false);
      return;
    }

    const newToken = crypto.randomUUID();
    const { error } = await supabase
      .from("profiles")
      .update({ calendar_subscription_token: newToken })
      .eq("id", user.id);

    setRegenerating(false);
    if (error) {
      toast.error(t.common.unexpectedError);
      return;
    }
    setToken(newToken);
    toast.success(t.export.tokenRegenerated);
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-1 text-sm font-semibold">{t.export.subscribeCalendar}</h2>
      <p className="text-muted-foreground mb-3 text-xs">{t.export.subscribeHint}</p>

      <div className="mb-3 flex items-center gap-2">
        {/* suppressHydrationWarning: el origen difiere entre servidor (relativo) y cliente (absoluto) */}
        <code
          suppressHydrationWarning
          className="bg-muted text-muted-foreground flex-1 overflow-hidden text-ellipsis rounded px-2 py-1 text-xs"
        >
          {subscribeUrl}
        </code>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copyUrl}>
          <Copy size={14} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          {/* suppressHydrationWarning: href con origin absoluto difiere en SSR */}
          <a href={webcalUrl} suppressHydrationWarning>
            {t.export.subscribeCalendar}
          </a>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={regenerateToken}
          disabled={regenerating}
          className="text-destructive hover:text-destructive"
        >
          <RotateCcw size={14} className="mr-1.5" />
          {regenerating ? t.export.regenerating : t.export.regenerateToken}
        </Button>
      </div>
    </div>
  );
}
