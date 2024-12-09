"use client";

import { type Card } from "@/server/db/schema";
import { UnoCard } from "./uno-card";
import { playCard } from "@/server/db/queries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Play({
  gameId,
  playerId,
  card,
  currentTurn,
  userId,
}: {
  gameId: number;
  playerId: number;
  card: Card;
  currentTurn: number;
  userId: number;
}) {
  const isPlayerTurn = currentTurn === userId;

  return (
    <div
      onClick={async () => {
        if (!isPlayerTurn) return;

        try {
          await playCard({
            gameId,
            playerId,
            cardId: card.id,
          });
        } catch (error) {
          toast.error((error as Error).message);
        }
      }}
      className={cn(
        "transition-all",
        isPlayerTurn
          ? "cursor-pointer hover:scale-105"
          : "cursor-not-allowed opacity-50",
      )}
    >
      <UnoCard card={card} />
    </div>
  );
}
