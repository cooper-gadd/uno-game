"use client";

import { Card, CardContent } from "@/components/ui/card";
import { drawCard } from "@/server/db/queries";

export function Draw({
  gameId,
  playerId,
}: {
  gameId: number;
  playerId: number;
}) {
  return (
    <Card
      className="h-36 w-24 cursor-pointer transition-transform hover:scale-105"
      onClick={async () =>
        await drawCard({
          gameId,
          playerId,
        })
      }
    >
      <CardContent className="flex h-full items-center justify-center text-2xl font-bold text-white">
        Draw
      </CardContent>
    </Card>
  );
}
