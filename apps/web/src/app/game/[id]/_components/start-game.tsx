"use client";

import { Button } from "@/components/ui/button";
import { startGame } from "@/server/db/queries";

export function StartGame({ gameId }: { gameId: number }) {
  return (
    <Button
      size="lg"
      className="mt-4"
      onClick={async () => await startGame(gameId)}
    >
      Start
    </Button>
  );
}