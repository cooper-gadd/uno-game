"use client";

import { Button } from "@/components/ui/button";
import { callUno } from "@/server/db/queries";
import { useOptimistic, useTransition } from "react";

export function CallUno({
  gameId,
  player,
  currentUserId,
}: {
  gameId: number;
  player: {
    id: number;
    userId: number;
    hasCalledUno: boolean;
  };
  currentUserId: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticHasCalledUno, setOptimisticHasCalledUno] = useOptimistic(
    player.hasCalledUno,
  );

  const isUnoPlayer = currentUserId === player.userId;

  const handleCallUno = () => {
    startTransition(async () => {
      if (isUnoPlayer) {
        setOptimisticHasCalledUno(true);
      }

      try {
        await callUno({
          gameId,
          playerId: player.id,
        });
      } catch (error) {
        if (isUnoPlayer) {
          setOptimisticHasCalledUno(false);
        }
        console.error("Error calling UNO:", error);
      }
    });
  };

  return (
    <Button
      className="ml-auto"
      variant={isUnoPlayer ? "default" : "destructive"}
      disabled={optimisticHasCalledUno || isPending}
      onClick={handleCallUno}
    >
      {isUnoPlayer ? "UNO!" : "Catch!"}
    </Button>
  );
}
