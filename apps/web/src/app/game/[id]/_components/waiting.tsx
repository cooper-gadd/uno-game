import { getCurrentUser } from "@/server/db/queries";
import { StartGame } from "./start-game";
import { db } from "@/server/db";
import { redirect } from "next/navigation";

export async function Waiting({ gameId }: { gameId: number }) {
  const currentUser = await getCurrentUser();

  const game = await db.query.games.findFirst({
    columns: {
      id: true,
      name: true,
    },
    with: {
      users: {
        columns: {
          id: true,
        },
      },
      players: {
        columns: {},
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
    where: (games, { eq }) => eq(games.id, gameId),
  });

  if (!game) {
    redirect("/lobby");
  }

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
