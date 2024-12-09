"use client";

import { type Card } from "@/server/db/schema";
import { UnoCard } from "./uno-card";
import { playCard } from "@/server/db/queries";

export function Play({
  gameId,
  playerId,
  card,
}: {
  gameId: number;
  playerId: number;
  card: Card;
}) {
  return (
    <div
      onClick={async () => {
        await playCard({
          gameId,
          playerId,
          cardId: card.id,
        });
      }}
    >
      <UnoCard card={card} />
    </div>
  );
}
