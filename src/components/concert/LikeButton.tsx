"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  concertId: string;
  initialLiked: boolean;
  initialCount: number;
  /** Si es null el usuario no está autenticado */
  userId: string | null;
}

export function LikeButton({ concertId, initialLiked, initialCount, userId }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Suscripción Realtime al likes_count del concierto
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`concert-likes-${concertId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "concerts",
          filter: `id=eq.${concertId}`,
        },
        (payload) => {
          const newCount = (payload.new as { likes_count: number }).likes_count;
          setCount(newCount);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [concertId]);

  async function handleToggle() {
    if (!userId) {
      toast.info("Inicia sesión para valorar este concierto.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("concert_id", concertId);
      if (error) {
        toast.error("Error al quitar el like.");
      } else {
        setLiked(false);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: userId, concert_id: concertId });
      if (error) {
        toast.error("Error al dar like.");
      } else {
        setLiked(true);
      }
    }
    setLoading(false);
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      aria-label={liked ? "Quitar like" : "Dar like"}
      className="gap-1.5"
    >
      <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </Button>
  );
}
