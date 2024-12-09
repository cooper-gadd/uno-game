import { ScrollArea } from "@/components/ui/scroll-area";
import { GameChatForm } from "./game-chat-form";
import { GameChats } from "./game-chats";
import { getCurrentUser } from "@/server/db/context";

export async function GameChat({ gameId }: { gameId: string }) {
  const currentUser = await getCurrentUser();
  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="h-[400px]">
        <GameChats gameId={gameId} />
      </ScrollArea>
      <GameChatForm currentUser={currentUser} gameId={gameId} />
    </div>
  );
}
