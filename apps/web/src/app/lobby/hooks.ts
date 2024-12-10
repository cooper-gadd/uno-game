import { createWebSocketConnection } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Chat = {
  name: string;
  message: string;
  sentAt: string;
};

export function useChat() {
  const ws = useRef<WebSocket | null>(null);
  const [chat, setChat] = useState<Chat[]>([]);

  useEffect(() => {
    const connect = () => {
      ws.current = createWebSocketConnection(
        "ws://localhost:8080/lobby-chat",
        (event: MessageEvent) => {
          try {
            const chat = JSON.parse(event.data as string) as Chat;
            if ("name" in chat && "message" in chat && "sentAt" in chat) {
              setChat((prev) => [...prev, chat]);
            }
          } catch (error) {
            console.error("Failed to parse chat message:", error);
          }
        },
      );

      ws.current.onclose = () => {
        console.log("Lobby Chat WebSocket Disconnected - Reconnecting...");
        setTimeout(connect, 1000);
      };
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, []);

  const sendChat = (chat: Chat) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(chat));
    }
  };

  return { chat, sendChat };
}

export function useLobbyUpdates() {
  const router = useRouter();
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      ws.current = createWebSocketConnection(
        "ws://localhost:8080/lobby-update",
        () => {
          router.refresh();
        },
      );

      ws.current.onclose = () => {
        console.log("Lobby Update WebSocket Disconnected - Reconnecting...");
        setTimeout(connect, 1000);
      };
    };

    connect();

    return () => {
      ws.current?.close();
    };
  }, [router]);

  return {
    sendUpdate: () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({}));
      }
    },
  };
}
