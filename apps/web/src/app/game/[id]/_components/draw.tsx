"use client";

import { cn } from "@/lib/utils";
import { drawCard } from "../actions";
import { useState } from "react";

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
  const [isDrawing, setIsDrawing] = useState(false);

  const handleDraw = async () => {
    if (!isPlayerTurn || isDrawing) return;

    try {
      setIsDrawing(true);
      await drawCard({ gameId, playerId });
    } catch (error) {
      console.error("Error drawing card:", error);
    } finally {
      setTimeout(() => {
        setIsDrawing(false);
      }, 1000);
    }
  };

  return (
    <svg
      viewBox="0 0 96 144"
      width="96"
      height="144"
      onClick={handleDraw}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow transition-transform",
        isPlayerTurn && !isDrawing
          ? "cursor-pointer hover:scale-105"
          : "cursor-not-allowed opacity-50",
        isDrawing && "animate-pulse border-green-500",
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
