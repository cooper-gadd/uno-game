import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createWebSocketConnection(
  url: string,
  onMessage: (event: MessageEvent) => void,
) {
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log("WebSocket Connected:", url);
  };

  ws.onmessage = onMessage;

  ws.onclose = () => {
    console.log("WebSocket Disconnected:", url);
  };

  return ws;
}
