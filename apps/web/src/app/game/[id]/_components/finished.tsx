import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type getGame } from "../actions";

export async function Finished({
  game,
}: {
  game: Awaited<ReturnType<typeof getGame>>;
}) {
  const winner = game.players.find((player) => player.playerHands.length === 0);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl">
          {game.name}
        </h1>
        <p className="text-xl text-muted-foreground">
          {winner
            ? `${winner.user.name} has won the game!`
            : "The game has ended."}
        </p>
        <Button asChild>
          <Link href="/lobby">Return to Lobby</Link>
        </Button>
      </div>
    </div>
  );
}
