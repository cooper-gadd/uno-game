import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CallUno } from "./call-uno";
import { getCurrentUser } from "@/server/db/context";
import { getPlayers } from "../actions";

export async function Players({
  gameId,
  currentTurn,
}: {
  gameId: number;
  currentTurn: number;
}) {
  const currentUser = await getCurrentUser();
  const players = await getPlayers({ gameId });

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
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">
                {player.user.name}
              </p>
              {player.userId === currentTurn && (
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {player.playerHands.length} cards
            </p>
          </div>
          {player.playerHands.length === 1 && (
            <CallUno
              gameId={gameId}
              player={player}
              currentUserId={currentUser.id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
