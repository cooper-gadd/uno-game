import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/queries";
import { redirect } from "next/navigation";
import { Waiting } from "./_components/waiting";

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
        <Waiting game={game} currentUser={currentUser} />
      )}
      {game.status === "active" && <p>Game is active</p>}
    </div>
  );
}
