"use server";

import { db } from "@/server/db";
import { getCurrentUser } from "@/server/db/context";
import {
  chats,
  games,
  playerHands,
  players,
  sessions,
  users,
  type CreateChat,
  type CreateGame,
  type CreatePlayer,
} from "@/server/db/schema";
import { and, eq, exists, gt, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { chatSchema, gameSchema } from "./schemas";
import { env } from "@/env";

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
  const currentUser = await getCurrentUser();

  return await db.query.games.findMany({
    columns: {
      id: true,
      name: true,
      createdAt: true,
      maxPlayers: true,
      status: true,
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
    where: (games, { or, eq, exists }) =>
      or(
        eq(games.status, "waiting"),
        exists(
          db
            .select()
            .from(players)
            .where(
              and(
                eq(players.gameId, games.id),
                eq(players.userId, currentUser.id),
              ),
            ),
        ),
      ),
    orderBy: (games, { desc, asc }) => [
      asc(games.status),
      desc(games.createdAt),
      asc(games.name),
      asc(games.id),
    ],
  });
}

export async function getLobbyUsers() {
  return await db
    .select({
      username: users.username,
      name: users.name,
      gamesPlayed: sql<number>`
      COUNT(DISTINCT ${players.gameId})
    `.as("games_played"),
      wins: sql<number>`
      COUNT(DISTINCT CASE
        WHEN ${games.status} = 'finished'
        AND NOT EXISTS (
          SELECT 1
          FROM ${playerHands} ph
          WHERE ph.player_id = ${players.id}
        )
        THEN ${games.id}
      END)
    `.as("wins"),
    })
    .from(users)
    .leftJoin(players, eq(players.userId, users.id))
    .leftJoin(games, eq(games.id, players.gameId))
    .where(
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
    )
    .groupBy(users.id, users.username, users.name);
}

async function notifyLobbyUpdate() {
  const ws = new WebSocket(
    `ws://${env.WEBSOCKET_URL ?? "localhost:8080"}/lobby-update`,
  );

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
