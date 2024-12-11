"use client";

import { cn } from "@/lib/utils";
import { type getCurrentUser } from "@/server/db/context";
import { useState } from "react";
import { drawCard, type getGame } from "../actions";
import { Play } from "./play";
import { UnoCard } from "./uno-card";

export function GameBoard({
  game,
  currentUser,
}: {
  game: Awaited<ReturnType<typeof getGame>>;
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  if (!game) {
    throw new Error("Game not found");
  }

  if (!game.currentTurn) {
    throw new Error("Current turn not found");
  }

  if (!game.card) {
    throw new Error("Card not found");
  }

  const player = game.players.find((p) => p.user.id === currentUser.id);

  if (!player) {
    throw new Error("Player not found");
  }

  const playerCards = player.playerHands;
  const isPlayerTurn = game.currentTurn === currentUser.id;

  const [isPlaying, setIsPlaying] = useState(false);
  const setIsPlayingAction = (value: boolean) => {
    setIsPlaying(value);
  };

  const handleDraw = async () => {
    if (!isPlayerTurn || isPlaying) return;

    try {
      setIsPlayingAction(true);
      await drawCard({ gameId: game.id, playerId: player.id });
    } catch (error) {
      console.error("Error drawing card:", error);
    } finally {
      setTimeout(() => {
        setIsPlayingAction(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <UnoCard card={game.card} />
        <svg
          viewBox="0 0 96 144"
          width="96"
          height="144"
          onClick={handleDraw}
          className={cn(
            "rounded-xl border bg-card text-card-foreground shadow transition-transform",
            isPlayerTurn && !isPlaying
              ? "cursor-pointer hover:scale-105"
              : "cursor-not-allowed opacity-50",
            isPlaying && "animate-pulse border-green-500",
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
      </div>
      <div className="flex w-full flex-wrap justify-center gap-4">
        {playerCards.map(({ card }) => (
          <div
            key={card.id}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <Play
              card={card}
              gameId={game.id}
              playerId={player.id}
              currentTurn={game.currentTurn!}
              userId={currentUser.id}
              isPlaying={isPlaying}
              setIsPlayingAction={setIsPlayingAction}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
