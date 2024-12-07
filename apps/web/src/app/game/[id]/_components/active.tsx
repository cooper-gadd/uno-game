import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/queries";
import { UnoCard } from "./uno-card";

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
    return <div>Error loading game state</div>;
  }

  const player = gameState.players[0];
  const playerCards = player.playerHands;

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">Current Game</h2>
        <UnoCard card={gameState.card!} />
      </div>

      <div className="w-full">
        <h3 className="mb-4 text-xl font-semibold">Your Cards:</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {playerCards.map(({ card }) => (
            <UnoCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
