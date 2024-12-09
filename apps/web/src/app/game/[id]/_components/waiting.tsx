import { getCurrentUser } from "@/server/db/context";
import { StartGame } from "./start-game";
import { type getGame } from "../actions";

export async function Waiting({
  game,
}: {
  game: Awaited<ReturnType<typeof getGame>>;
}) {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl">
          {game.name}
        </h1>
        <p className="text-xl text-muted-foreground">
          There are {game.players.length} players in this game
        </p>
        {game.users.id === currentUser.id && <StartGame gameId={game.id} />}
      </div>
    </div>
  );
}
