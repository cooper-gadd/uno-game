import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatForm } from "./chat-form";
import { Chats } from "./chats";
import { getCurrentUser } from "@/server/db/queries";

export async function Chat() {
  const currentUser = await getCurrentUser();
  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="h-[400px]">
        <Chats />
      </ScrollArea>
      <ChatForm currentUser={currentUser} />
    </div>
  );
}
