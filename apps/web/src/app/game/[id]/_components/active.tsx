"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type getCurrentUser } from "@/server/db/context";
import { redirect } from "next/navigation";
import { useState } from "react";
import { type getGame } from "../actions";
import { Draw } from "./draw";
import { EndGame } from "./end-game";
import { GameChat } from "./game-chat";
import { Play } from "./play";
import { Players } from "./players";
import { UnoCard } from "./uno-card";

export function Active({
  game,
  currentUser,
}: {
  game: Awaited<ReturnType<typeof getGame>>;
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const setIsPlayingAction = (value: boolean) => {
    setIsPlaying(value);
  };

  if (!game.currentTurn) {
    throw new Error("Current turn not found");
  }

  const player = game.players.find((p) => p.user.id === currentUser.id);

  if (!player) {
    redirect("/lobby");
  }

  const playerCards = player.playerHands;

  return (
    <div className="flex-1 flex-col space-y-6 p-4 md:flex">
      <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{game.name}</h2>
          <p className="text-muted-foreground">
            Have fun playing Uno with your friends!
          </p>
        </div>
        <EndGame gameId={game.id} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Game Board</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Game Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <GameChat gameId={game.id.toString()} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Players gameId={game.id} currentTurn={game.currentTurn} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
