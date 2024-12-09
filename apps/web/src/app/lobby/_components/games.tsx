import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Join } from "./join";
import { getLobbyGames } from "../actions";

export async function Games() {
  const lobbyGames = await getLobbyGames();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {lobbyGames.map((game) => (
        <Card key={game.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {game.users.name}
            </CardTitle>
            <Join gameId={game.id} />
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
      ))}
    </div>
  );
}
