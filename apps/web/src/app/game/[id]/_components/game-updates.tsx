"use client";

import { useGameUpdates } from "../hooks";

export function GameUpdates({ gameId }: { gameId: number }) {
  useGameUpdates(gameId.toString());
  return null;
}
