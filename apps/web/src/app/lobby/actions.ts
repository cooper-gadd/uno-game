"use server";

import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/context";
import {
  chats,
  games,
  players,
  sessions,
  type CreateChat,
  type CreateGame,
  type CreatePlayer,
} from "@/server/db/schema";
import { chatSchema, gameSchema } from "./schemas";
import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function createGame(
  createGame: Pick<CreateGame, "name" | "maxPlayers">,
) {
  gameSchema.parse(createGame);

  const currentUser = await getCurrentUser();

  const [game] = await db
    .insert(games)
    .values({
      ...createGame,
      createdBy: currentUser.id,
    })
    .returning({ insertedId: games.id });

  if (!game) throw new Error("Failed to create game");

  try {
    await notifyLobbyUpdate();
  } catch (error) {
    console.error("Failed to notify lobby update:", error);
  }

  await createPlayer({
    gameId: game.insertedId,
  });

  redirect(`/game/${game.insertedId}`);
}

export async function createPlayer(createPlayer: Pick<CreatePlayer, "gameId">) {
  const currentUser = await getCurrentUser();

  const game = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, createPlayer.gameId),
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const currentPlayers = await db.query.players.findMany({
    where: (players, { eq }) => eq(players.gameId, createPlayer.gameId),
  });

  if (currentPlayers.some((player) => player.userId === currentUser.id)) {
    redirect(`/game/${createPlayer.gameId}`);
  }

  if (currentPlayers.length >= game.maxPlayers) {
    throw new Error("Game is full");
  }

  await db.insert(players).values({
    ...createPlayer,
    userId: currentUser.id,
    turnOrder: currentPlayers.length + 1,
  });

  try {
    await notifyLobbyUpdate();
  } catch (error) {
    console.error("Failed to notify lobby update:", error);
  }

  redirect(`/game/${createPlayer.gameId}`);
}

export async function createChat(createChat: Pick<CreateChat, "message">) {
  chatSchema.parse(createChat);

  const currentUser = await getCurrentUser();

  await db.insert(chats).values({
    ...createChat,
    userId: currentUser.id,
  });
}

export async function getLobbyGames() {
  return await db.query.games.findMany({
    columns: {
      id: true,
      name: true,
      createdAt: true,
      maxPlayers: true,
    },
    with: {
      users: {
        columns: {
          name: true,
        },
      },
      players: {
        columns: {},
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      },
    },
    where: (games, { eq }) => eq(games.status, "waiting"),
  });
}

export async function getLobbyUsers() {
  return await db.query.users.findMany({
    columns: {
      username: true,
      name: true,
    },
    where: (users, { exists }) =>
      exists(
        db
          .select()
          .from(sessions)
          .where(
            and(
              eq(sessions.userId, users.id),
              gt(sessions.expiresAt, new Date()),
            ),
          ),
      ),
  });
}

async function notifyLobbyUpdate() {
  const ws = new WebSocket(`ws://localhost:8080/lobby-update`);

  return new Promise<void>((resolve, reject) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({}));
      ws.close();
      resolve();
    };

    ws.onerror = () => {
      ws.close();
      resolve();
    };

    setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 5000);
  });
}
