import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import Link from "next/link";

export async function Finished({ gameId }: { gameId: number }) {
  const game = await db.query.games.findFirst({
    columns: {
      id: true,
      name: true,
    },
    with: {
      players: {
        with: {
          user: {
            columns: {
              name: true,
            },
          },
          playerHands: true,
        },
      },
    },
    where: (games, { eq }) => eq(games.id, gameId),
  });

  if (!game) {
    return null;
  }

  const winner = game.players.find((player) => player.playerHands.length === 0);

  if (!winner) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl">
          {game.name}
        </h1>
        <p className="text-xl text-muted-foreground">
          {winner.user.name} has won the game!
        </p>
        <Button asChild>
          <Link href="/lobby">Return to Lobby</Link>
        </Button>
      </div>
    </div>
  );
}
