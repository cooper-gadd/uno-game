"use server";

import { env } from "@/env";
import {
  chatSchema,
  gameSchema,
  loginSchema,
  registerSchema,
} from "@/lib/schemas";
import { db } from "@/server/db";
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
  type CreateUser,
} from "@/server/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";

export async function login({
  username,
  password: plainPassword,
}: {
  username: string;
  password: string;
}) {
  loginSchema.parse({
    username,
    password: plainPassword,
  });

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, username),
  });

  if (!user) {
    return { success: false, error: "Invalid username" };
  }

  const isValidPassword = await bcrypt.compare(plainPassword, user.password);
  if (!isValidPassword) {
    return { success: false, error: "Invalid password" };
  }

  await db.delete(sessions).where(eq(sessions.userId, user.id));

  const cookieStore = await cookies();
  const token = uuid();
  cookieStore.set("session", token, {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours
  });

  await db.insert(sessions).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours
  });

  redirect("/lobby");
}

export async function register({
  createUser,
  nonce,
}: {
  createUser: CreateUser;
  nonce: {
    ip: string;
    browser: string;
    timestamp: Date;
  };
}) {
  registerSchema.parse(createUser);

  const header = await headers();
  const ip =
    (header.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0] ?? "unknown";
  const browser = header.get("user-agent") ?? "unknown";
  const timestamp = new Date();

  if (
    nonce.ip !== ip ||
    nonce.browser !== browser ||
    nonce.timestamp.getTime() + 1000 * 60 * 5 < timestamp.getTime() // 5 minutes
  ) {
    throw new Error("Invalid nonce");
  }

  const hashedPassword = await bcrypt.hash(
    createUser.password,
    Number(env.SALT_ROUNDS),
  );

  const [user] = await db
    .insert(users)
    .values({
      ...createUser,
      password: hashedPassword,
    })
    .returning();

  if (!user) throw new Error("Failed to create user");

  await login({
    username: user.username,
    password: createUser.password, // password is not hashed
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session");

  if (!token) {
    throw new Error("No session token found");
  }

  const session = await db.query.sessions.findFirst({
    where: (sessions, { eq }) => eq(sessions.token, token.value),
    columns: {
      userId: true,
    },
  });

  if (!session) {
    throw new Error("No session found");
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, session.userId),
    columns: {
      id: true,
      username: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error("No user found");
  }

  return user;
}

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

  await createPlayer({
    gameId: game.insertedId,
  });
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

export async function startGame(gameId: number) {
  const game = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
    with: {
      players: true,
    },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  if (game.players.length < 2) {
    throw new Error("Game must have at least 2 players");
  }

  const cards = await db.query.cards.findMany();
  const deck = cards.sort(() => Math.random() - 0.5);

  for (const player of game.players) {
    const playerCards = deck.splice(0, 7);
    await db.insert(playerHands).values(
      playerCards.map((card) => ({
        playerId: player.id,
        cardId: card.id,
      })),
    );
  }

  const firstCard = deck.find((card) => !card.type.includes("wild"));

  if (!firstCard) {
    throw new Error("No valid first card found");
  }

  const firstPlayer = game.players[0];

  if (!firstPlayer) {
    throw new Error("No first player found");
  }

  await db
    .update(games)
    .set({
      status: "active",
      topCardId: firstCard.id,
      currentTurn: firstPlayer.id,
    })
    .where(eq(games.id, gameId));

  redirect(`/game/${gameId}`);
}
