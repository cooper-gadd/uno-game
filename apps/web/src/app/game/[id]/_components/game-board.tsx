"use client";

import { type getCurrentUser } from "@/server/db/context";
import { useState } from "react";
import { type getGame } from "../actions";
import { UnoCard } from "./uno-card";
import { Draw } from "./draw";
import { Play } from "./play";

export function GameBoard({
  game,
  currentUser,
}: {
  game: Awaited<ReturnType<typeof getGame>>;
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  if (!game) throw new Error("Game not found");
  if (!game.currentTurn) throw new Error("Current turn not found");
  if (!game.card) throw new Error("Card not found");

  const player = game.players.find((p) => p.user.id === currentUser.id);
  if (!player) throw new Error("Player not found");

  const playerCards = player.playerHands;

  const [isPlaying, setIsPlaying] = useState(false);
  const setIsPlayingAction = (value: boolean) => {
    setIsPlaying(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <UnoCard card={game.card} />
        <Draw
          gameId={game.id}
          playerId={player.id}
          currentTurn={game.currentTurn}
          userId={currentUser.id}
          isPlaying={isPlaying}
          setIsPlayingAction={setIsPlayingAction}
        />
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
