import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type GameChat = {
  name: string;
  message: string;
  sentAt: string;
  gameId: string;
};

type GameUpdate = {
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
      try {
        const chat = JSON.parse(event.data as string) as GameChat;
        if ("name" in chat && "message" in chat && chat.gameId === gameId) {
          setChat((prev) => [...prev, chat]);
        }
      } catch (error) {
        console.error("Failed to parse chat message:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("Game Chat WebSocket Disconnected");
    };

    ws.current.onerror = (error: Event) => {
      console.error("Game Chat WebSocket error:", error);
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

export function useGameUpdates(gameId: string) {
  const router = useRouter();
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(
      `ws://localhost:8080/game-update?gameId=${gameId}`,
    );

    ws.current.onopen = () => {
      console.log("Game Update WebSocket Connected");
    };

    ws.current.onmessage = (event: MessageEvent) => {
      try {
        const update = JSON.parse(event.data as string) as GameUpdate;
        if (update.gameId === gameId) {
          router.refresh();
        }
      } catch (error) {
        console.error("Failed to parse game update:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("Game Update WebSocket Disconnected");
    };

    ws.current.onerror = (error: Event) => {
      console.error("Game Update WebSocket error:", error);
    };

    return () => {
      ws.current?.close();
    };
  }, [gameId, router]);

  return {
    sendUpdate: () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ gameId }));
      }
    },
  };
}
