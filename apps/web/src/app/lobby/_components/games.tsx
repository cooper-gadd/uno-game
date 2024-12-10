"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type getCurrentUser } from "@/server/db/context";
import { createPlayer, type getLobbyGames } from "../actions";

export function Games({
  currentUser,
  lobbyGames,
}: {
  lobbyGames: Awaited<ReturnType<typeof getLobbyGames>>;
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {lobbyGames.map((game) => {
        const isFull = game.players.length === game.maxPlayers;
        const isPlayerInGame = game.players.some(
          (player) => player.user.name === currentUser.name,
        );
        const isDisabled = isFull && !isPlayerInGame;

        return (
          <Card
            key={game.id}
            onClick={async () => {
              if (!isDisabled)
                await createPlayer({
                  gameId: game.id,
                });
            }}
            className={cn(
              "transition-all",
              !isDisabled
                ? "cursor-pointer hover:scale-105"
                : "cursor-not-allowed opacity-50",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {game.users.name}
              </CardTitle>
              <Badge className="p-1">
                {game.status[0]!.toUpperCase() + game.status.slice(1)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{game.name}</div>
              <p className="text-xs text-muted-foreground">
                {new Date(game.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "numeric",
                })}
              </p>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-start gap-2">
                {Array.from({ length: game.maxPlayers }).map((_, index) => {
                  const player = game.players[index];
                  return (
                    <Avatar key={index}>
                      {player ? (
                        <>
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${player.user.name}`}
                          />
                          <AvatarFallback>{player.user.name[0]}</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src="#" />
                          <AvatarFallback></AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  );
                })}
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
