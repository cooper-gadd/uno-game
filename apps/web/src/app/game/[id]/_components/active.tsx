import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/server/db/context";
import { redirect } from "next/navigation";
import { type getGame } from "../actions";
import { EndGame } from "./end-game";
import { GameBoard } from "./game-board";
import { GameChat } from "./game-chat";
import { Players } from "./players";

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

  return (
    <div className="flex-1 flex-col space-y-6 p-4 md:flex">
      <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{game.name}</h2>
          <p className="text-muted-foreground">
            Have fun playing Uno with your friends!
          </p>
        </div>
        <EndGame gameId={game.id} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Game Board</CardTitle>
        </CardHeader>
        <CardContent>
          <GameBoard game={game} currentUser={currentUser} />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Game Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <GameChat gameId={game.id.toString()} />
          </CardContent>
        </Card>
        <Card>
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
