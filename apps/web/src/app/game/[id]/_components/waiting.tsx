import { Button } from "@/components/ui/button";

export function Waiting({
  game,
  currentUser,
}: {
  game: {
    id: number;
    name: string;
    status: "waiting" | "active" | "finished";
    createdAt: Date;
    maxPlayers: number;
    users: {
      id: number;
    };
    players: {
      user: {
        name: string;
      };
    }[];
  };
  currentUser: {
    id: number;
    name: string;
    username: string;
  };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {game.status === "waiting" && (
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-7xl">
            {game.name}
          </h1>
          <p className="text-xl text-muted-foreground">
            There are {game.players.length} players in this game
          </p>
          {game.users.id === currentUser.id && (
            <Button size="lg" className="mt-4">
              Start
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
