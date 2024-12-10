"use client";

import { Button } from "@/components/ui/button";
import { endGame } from "../actions";

export function EndGame({ gameId }: { gameId: number }) {
  return (
    <Button
      onClick={async () => {
        await endGame({
          gameId,
        });
      }}
    >
      End Game
    </Button>
  );
}
