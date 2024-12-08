"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useGameChat } from "@/hooks/use-game-chat";
import { useEffect, useRef, useState } from "react";

export function GameChats({ gameId }: { gameId: string }) {
  const { chat } = useGameChat(gameId);
  const [messages, setMessages] = useState<
    {
      id: number;
      name: string;
      message: string;
      sentAt: Date;
    }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chat.length > 0) {
      const lastMessage = chat[chat.length - 1];
      if (lastMessage)
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            name: lastMessage.name,
            message: lastMessage.message,
            sentAt: new Date(lastMessage.sentAt),
          },
        ]);
      scrollToBottom();
    }
  }, [chat]);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <Card key={message.id} className="bg-muted">
          <CardHeader>
            <div className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>{message.name}</CardTitle>
              {message.sentAt.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <CardDescription>{message.message}</CardDescription>
          </CardHeader>
        </Card>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
