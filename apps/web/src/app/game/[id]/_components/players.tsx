import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";

export async function Players({ gameId }: { gameId: number }) {
  const players = await db.query.players.findMany({
    where: (players, { eq }) => eq(players.gameId, gameId),
    with: {
      user: true,
      playerHands: true,
    },
  });

  return (
    <div>
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center gap-2 py-4 first:pt-0 last:pb-0"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://avatar.vercel.sh/${player.user.name}`}
              alt={`${player.user.name}'s avatar`}
            />
            <AvatarFallback>{player.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {player.user.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {player.playerHands.length} cards
            </p>
          </div>
          {player.playerHands.length === 1 && (
            <Button className="ml-auto">UNO!</Button>
          )}
        </div>
      ))}
    </div>
  );
}
