"use client";

import { useState } from "react";
import { Play } from "./play";

export function Deck({
  playerCards,
  gameId,
  playerId,
  currentTurn,
  userId,
}: {
  playerCards: {
    id: number;
    playerId: number;
    cardId: number;
    card: {
      id: number;
      type:
        | "number"
        | "wild"
        | "draw_two"
        | "reverse"
        | "skip"
        | "wild_draw_four";
      color: "red" | "green" | "blue" | "yellow" | "wild";
      value: number | null;
    };
  }[];
  gameId: number;
  playerId: number;
  currentTurn: number;
  userId: number;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const setIsPlayingAction = (value: boolean) => {
    setIsPlaying(value);
  };

  return (
    <div className="flex w-full flex-wrap justify-center gap-4">
      {playerCards.map(({ card }) => (
        <div
          key={card.id}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <Play
            card={card}
            gameId={gameId}
            playerId={playerId}
            currentTurn={currentTurn}
            userId={userId}
            isPlaying={isPlaying}
            setIsPlayingAction={setIsPlayingAction}
          />
        </div>
      ))}
    </div>
  );
}
