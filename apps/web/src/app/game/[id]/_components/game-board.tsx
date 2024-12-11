"use client";

import { type getCurrentUser } from "@/server/db/context";
import { type getGame } from "../actions";
import { UnoCard } from "./uno-card";
import { Draw } from "./draw";
import { Deck } from "./deck";

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

  const player = game.players.find((p) => p.user.id === currentUser.id);

  if (!player) {
    throw new Error("Player not found");
  }

  const playerCards = player.playerHands;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2">
        <UnoCard card={game.card!} />
        <Draw
          gameId={game.id}
          playerId={player.id}
          currentTurn={game.currentTurn}
          userId={currentUser.id}
        />
      </div>
      <Deck
        playerCards={playerCards}
        gameId={game.id}
        playerId={player.id}
        currentTurn={game.currentTurn}
        userId={currentUser.id}
      />
    </div>
  );
}
