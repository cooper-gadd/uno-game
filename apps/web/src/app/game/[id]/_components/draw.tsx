"use client";

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
    <svg
      viewBox="0 0 96 144"
      width="96"
      height="144"
      onClick={async () => {
        if (!isPlayerTurn) return;
        await drawCard({ gameId, playerId });
      }}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow transition-transform",
        isPlayerTurn
          ? "cursor-pointer hover:scale-105"
          : "cursor-not-allowed opacity-50",
      )}
    >
      <text
        x="48"
        y="72"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-2xl font-bold"
        fill="currentColor"
      >
        Draw
      </text>
    </svg>
  );
}
