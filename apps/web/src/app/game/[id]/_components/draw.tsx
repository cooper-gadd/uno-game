"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { drawCard } from "../actions";

export function Draw({
  gameId,
  playerId,
  currentTurn,
  userId,
}: {
  gameId: number;
  playerId: number;
  currentTurn: number;
  userId: number;
}) {
  const isPlayerTurn = currentTurn === userId;

  return (
    <Card
      className={cn(
        "h-36 w-24 transition-transform",
        isPlayerTurn
          ? "cursor-pointer hover:scale-105"
          : "cursor-not-allowed opacity-50",
      )}
      onClick={async () => {
        if (!isPlayerTurn) return;

        await drawCard({
          gameId,
          playerId,
        });
      }}
    >
      <CardContent className="flex h-full items-center justify-center text-2xl font-bold text-white">
        Draw
      </CardContent>
    </Card>
  );
}
