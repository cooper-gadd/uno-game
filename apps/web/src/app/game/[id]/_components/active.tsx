import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/server/db/context";
import { redirect } from "next/navigation";
import { type getGame } from "../actions";
import { Draw } from "./draw";
import { GameChat } from "./game-chat";
import { Play } from "./play";
import { Players } from "./players";
import { UnoCard } from "./uno-card";

export async function Active({
  game,
}: {
  game: Awaited<ReturnType<typeof getGame>>;
}) {
  const currentUser = await getCurrentUser();

  if (!game.currentTurn) {
    throw new Error("Current turn not found");
  }

  const player = game.players.find((p) => p.user.id === currentUser.id);

  if (!player) {
    redirect("/lobby");
  }

  const playerCards = player.playerHands;

  return (
    <div className="flex-1 flex-col space-y-6 p-4 md:flex">
      <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{game.name}</h2>
          <p className="text-muted-foreground">
            Have fun playing Uno with your friends!
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Game Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-2">
              <UnoCard card={game.card!} />
              <Draw
                gameId={game.id}
                playerId={player.id}
                currentTurn={game.currentTurn}
                userId={currentUser.id}
              />
            </div>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {playerCards.map(({ card }) => (
                <div
                  key={card.id}
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <Play
                    card={card}
                    gameId={game.id}
                    playerId={player.id}
                    currentTurn={game.currentTurn!}
                    userId={currentUser.id}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Game Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <GameChat gameId={game.id.toString()} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <Players gameId={game.id} currentTurn={game.currentTurn} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
