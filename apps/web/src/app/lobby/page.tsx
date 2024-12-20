import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/server/db/context";
import { Chat } from "./_components/chat";
import { GameForm } from "./_components/game-form";
import { Games } from "./_components/games";
import { LobbyUpdates } from "./_components/lobby-updates";
import { Users } from "./_components/users";
import { getLobbyGames } from "./actions";

export default async function Page() {
  const currentUser = await getCurrentUser();
  const lobbyGames = await getLobbyGames();

  return (
    <div className="flex-1 flex-col space-y-6 p-4 md:flex">
      <LobbyUpdates />
      <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Jump into a game or create a new one.
          </p>
        </div>
        <GameForm />
      </div>
      <Games currentUser={currentUser} lobbyGames={lobbyGames} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lobby Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Chat />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Users />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
