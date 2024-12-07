import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/queries";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
        <Card
          className={cn("h-36 w-24", getCardBackground(gameState.card!.color))}
        >
          <CardContent className="flex h-full items-center justify-center text-2xl font-bold text-white">
            {renderCardContent(gameState.card!)}
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <h3 className="mb-4 text-xl font-semibold">Your Cards:</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {playerCards.map(({ card }) => (
            <Card
              key={card.id}
              className={cn(
                "h-36 w-24 cursor-pointer transition-transform hover:scale-105",
                getCardBackground(card.color),
              )}
            >
              <CardContent className="flex h-full items-center justify-center text-2xl font-bold text-white">
                {renderCardContent(card)}
              </CardContent>
              <CardFooter className="bg-black/20 p-2 text-xs text-white">
                {card.type.replace("_", " ").toUpperCase()}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCardBackground(color: string): string {
  switch (color) {
    case "red":
      return "bg-red-600 hover:bg-red-500 border-red-700";
    case "blue":
      return "bg-blue-600 hover:bg-blue-500 border-blue-700";
    case "green":
      return "bg-green-600 hover:bg-green-500 border-green-700";
    case "yellow":
      return "bg-yellow-500 hover:bg-yellow-400 border-yellow-600";
    case "wild":
      return "bg-gradient-to-br from-red-500 via-blue-500 to-green-500 hover:from-red-400 hover:via-blue-400 hover:to-green-400";
    default:
      return "bg-gray-600 hover:bg-gray-500 border-gray-700";
  }
}

function renderCardContent(card: {
  color: string;
  type: string;
  value: number | null;
}) {
  if (card.type === "number") {
    return card.value;
  }

  switch (card.type) {
    case "draw_two":
      return "+2";
    case "reverse":
      return "⟲";
    case "skip":
      return "⊘";
    case "wild":
      return "W";
    case "wild_draw_four":
      return "W+4";
    default:
      return "?";
  }
}
