import { useEffect, useRef, useState } from "react";

type GameChat = {
  name: string;
  message: string;
  sentAt: string;
  gameId: string;
};

export function useGameChat(gameId: string) {
  const ws = useRef<WebSocket | null>(null);
  const [chat, setChat] = useState<GameChat[]>([]);

  useEffect(() => {
    ws.current = new WebSocket(
      `ws://localhost:8080/game-chat?gameId=${gameId}`,
    );

    ws.current.onopen = () => {
      console.log("Game Chat WebSocket Connected");
    };

    ws.current.onmessage = (event: MessageEvent) => {
      const chat = JSON.parse(event.data as string) as GameChat;
      if (chat.gameId === gameId) {
        setChat((prev) => [...prev, chat]);
      }
    };

    ws.current.onclose = () => {
      console.log("Game Chat WebSocket Disconnected");
    };

    return () => {
      ws.current?.close();
    };
  }, [gameId]);

  const sendChat = (chat: Omit<GameChat, "gameId">) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ ...chat, gameId }));
    }
  };

  return { chat, sendChat };
}
