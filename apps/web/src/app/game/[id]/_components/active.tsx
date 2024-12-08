import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/queries";
import { redirect } from "next/navigation";
import { GameChat } from "./game-chat";
import { UnoCard } from "./uno-card";
import { Players } from "./players";

export async function Active({ gameId }: { gameId: number }) {
  const currentUser = await getCurrentUser();

  const gameState = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
    with: {
      players: {
        where: (players, { eq }) => eq(players.userId, currentUser.id),
        with: {
          playerHands: {
            with: {
              card: true,
            },
          },
        },
      },
      card: true,
    },
  });

  if (!gameState?.players[0]) {
    redirect("/lobby");
  }

  const player = gameState.players[0];
  const playerCards = player.playerHands;

  return (
    <div className="flex-1 flex-col space-y-6 p-4 md:flex">
      <div className="flex items-center justify-center">
        <UnoCard card={gameState.card!} />
      </div>
      <div className="flex w-full flex-wrap justify-center gap-4">
        {playerCards.map(({ card }) => (
          <div
            key={card.id}
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <UnoCard card={card} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Game Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <GameChat gameId={gameId.toString()} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Players gameId={gameId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
