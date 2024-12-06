import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chat } from "./_components/chat";
import { GameForm } from "./_components/game-form";
import { Games } from "./_components/games";
import { Users } from "./_components/users";

export default function Page() {
  return (
    <div className="flex-1 flex-col space-y-6 p-4 md:flex">
      <div className="flex flex-col items-start justify-between space-y-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
          <p className="text-muted-foreground">
            Jump into a game or create a new one.
          </p>
        </div>
        <GameForm />
      </div>
      <Games />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Lobby Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <Chat />
          </CardContent>
        </Card>
        <Card className="col-span-3">
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
