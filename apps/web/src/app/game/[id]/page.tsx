import { db } from "@/server/db";
import { redirect } from "next/navigation";
import { Active } from "./_components/active";
import { Waiting } from "./_components/waiting";

export default async function Game({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gameId = Number((await params).id);

  const game = await db.query.games.findFirst({
    columns: { status: true },
    where: (games, { eq }) => eq(games.id, gameId),
  });

  if (!game || game.status === "finished") {
    redirect("/lobby");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      {game.status === "waiting" && <Waiting gameId={gameId} />}
      {game.status === "active" && <Active gameId={gameId} />}
    </div>
  );
}
