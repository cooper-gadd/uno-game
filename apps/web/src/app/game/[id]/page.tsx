import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/queries";
import { redirect } from "next/navigation";

export default async function Game({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  const game = await db.query.games.findFirst({
    columns: {
      id: true,
      name: true,
      createdAt: true,
      maxPlayers: true,
      status: true,
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
    where: (games, { eq }) => eq(games.id, Number(id)),
  });

  if (!game || game.status === "finished") {
    redirect("/lobby");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {game.status === "waiting" && (
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl">
            {game.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            There are {game.players.length} players in this game
          </p>
          {game.users.id === currentUser.id && (
            <Button size="lg" className="mt-4">
              Start
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
