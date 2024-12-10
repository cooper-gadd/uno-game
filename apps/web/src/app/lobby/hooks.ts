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
    ws.current = new WebSocket("ws://localhost:8080/lobby-chat");

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
    };

    ws.current.onmessage = (event: MessageEvent) => {
      const chat = JSON.parse(event.data as string) as Chat;
      setChat((prev) => [...prev, chat]);
    };

    ws.current.onclose = () => {
      console.log("WebSocket Disconnected");
    };

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
