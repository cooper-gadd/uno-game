"use client";

import { Button } from "@/components/ui/button";
import { createPlayer } from "../actions";

export function Join({ gameId }: { gameId: number }) {
  return (
    <Button
      size={"sm"}
      variant={"ghost"}
      onClick={async () => {
        await createPlayer({
          gameId,
        });
      }}
    >
      Join
    </Button>
  );
}
