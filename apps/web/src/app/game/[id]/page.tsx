import { getCurrentUser } from "@/server/db/context";
import { Active } from "./_components/active";
import { Finished } from "./_components/finished";
import { GameUpdates } from "./_components/game-updates";
import { Waiting } from "./_components/waiting";
import { getGame } from "./actions";

export default async function Game({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gameId = Number((await params).id);
  const game = await getGame({ gameId });
  const CurrentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <GameUpdates gameId={game.id} />
      {game.status === "waiting" && (
        <Waiting game={game} currentUser={CurrentUser} />
      )}
      {game.status === "active" && (
        <Active game={game} currentUser={CurrentUser} />
      )}
      {game.status === "finished" && <Finished game={game} />}
    </div>
  );
}
