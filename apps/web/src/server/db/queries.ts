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
  gameChats,
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
import { revalidatePath } from "next/cache";
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
  await db.transaction(async (tx) => {
    registerSchema.parse(createUser);

    const header = await headers();
    const ip =
      (header.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0] ?? "unknown";
    const browser = header.get("user-agent") ?? "unknown";
    const timestamp = new Date();

    if (
      nonce.ip !== ip ||
      nonce.browser !== browser ||
      nonce.timestamp.getTime() + 1000 * 60 * 5 < timestamp.getTime()
    ) {
      throw new Error("Invalid nonce");
    }

    const existingUser = await tx.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, createUser.username),
    });

    if (existingUser) {
      throw new Error("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(
      createUser.password,
      Number(env.SALT_ROUNDS),
    );

    const [user] = await tx
      .insert(users)
      .values({
        ...createUser,
        password: hashedPassword,
      })
      .returning();

    if (!user) throw new Error("Failed to create user");

    await login({
      username: user.username,
      password: createUser.password,
    });
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
  await db.transaction(async (tx) => {
    const game = await tx.query.games.findFirst({
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

    const cards = await tx.query.cards.findMany();
    const deck = cards.sort(() => Math.random() - 0.5);

    for (const player of game.players) {
      const playerCards = deck.splice(0, 7);
      await tx.insert(playerHands).values(
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

    await tx
      .update(games)
      .set({
        status: "active",
        topCardId: firstCard.id,
        currentTurn: firstPlayer.userId,
      })
      .where(eq(games.id, gameId));

    revalidatePath(`/game/${gameId}`);
  });
}

export async function createGameChat({
  message,
  gameId,
}: {
  message: string;
  gameId: number;
}) {
  chatSchema.parse({ message });

  const currentUser = await getCurrentUser();

  const [chatEntry] = await db
    .insert(chats)
    .values({
      message,
      userId: currentUser.id,
    })
    .returning();

  if (!chatEntry) throw new Error("Failed to create chat");

  await db.insert(gameChats).values({
    gameId,
    chatId: chatEntry.id,
  });
}

export async function drawCard({
  gameId,
  playerId,
}: {
  gameId: number;
  playerId: number;
}) {
  const game = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
    with: {
      players: {
        where: (players, { eq }) => eq(players.id, playerId),
        with: {
          playerHands: {
            with: {
              card: true,
            },
          },
        },
      },
    },
  });

  if (!game) {
    throw new Error("Game not found");
  }

  const player = game.players[0];

  if (!player) {
    throw new Error("Player not found");
  }

  if (player.hasCalledUno) {
    await db
      .update(players)
      .set({ hasCalledUno: false })
      .where(eq(players.id, playerId));
  }

  const cards = await db.query.cards.findMany();
  const playerCards = player.playerHands.map((hand) => hand.card);
  const deck = cards.filter(
    (card) => !playerCards.some((playerCard) => playerCard.id === card.id),
  );
  const randomIndex = Math.floor(Math.random() * deck.length);
  const drawnCard = deck[randomIndex];

  if (!drawnCard) {
    throw new Error("No card found");
  }

  await db.insert(playerHands).values({
    playerId,
    cardId: drawnCard.id,
  });

  revalidatePath(`/game/${gameId}`);
}

export async function playCard({
  gameId,
  playerId,
  cardId,
  selectedColor,
}: {
  gameId: number;
  playerId: number;
  cardId: number;
  selectedColor?: "red" | "green" | "blue" | "yellow";
}) {
  await db.transaction(async (tx) => {
    const game = await tx.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, gameId),
      with: {
        players: {
          orderBy: (players, { asc }) => [asc(players.turnOrder)],
          with: {
            playerHands: {
              where: (playerHands, { eq }) => eq(playerHands.cardId, cardId),
            },
          },
        },
      },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (!game.topCardId) {
      throw new Error("No top card found");
    }

    const topCard = await tx.query.cards.findFirst({
      where: (cards, { eq }) => eq(cards.id, game.topCardId!),
    });

    if (!topCard) {
      throw new Error("Top card not found");
    }

    const card = await tx.query.cards.findFirst({
      where: (cards, { eq }) => eq(cards.id, cardId),
    });

    if (!card) {
      throw new Error("Card not found");
    }

    if (card.color === "wild" || card.type === "wild_draw_four") {
      if (!selectedColor) {
        throw new Error("Must select a color for wild card");
      }

      const colorCard = await tx.query.cards.findFirst({
        where: (cards, { and, eq }) =>
          and(
            eq(cards.color, selectedColor),
            eq(cards.type, "number"),
            eq(cards.value, 1),
          ),
      });

      if (!colorCard) {
        throw new Error(`No ${selectedColor} cards available`);
      }

      await tx
        .update(games)
        .set({ topCardId: colorCard.id })
        .where(eq(games.id, gameId));
    } else {
      if (
        card.type === "number" &&
        topCard.color !== card.color &&
        topCard.value !== card.value
      ) {
        throw new Error("Invalid play.");
      }

      if (
        ["draw_two", "skip", "reverse"].includes(card.type) &&
        topCard.color !== card.color &&
        topCard.type !== card.type
      ) {
        throw new Error("Invalid play.");
      }

      await tx
        .update(games)
        .set({ topCardId: cardId })
        .where(eq(games.id, gameId));
    }

    await tx.delete(playerHands).where(eq(playerHands.cardId, cardId));

    const currentPlayer = game.players.find((p) => p.id === playerId);
    if (!currentPlayer) throw new Error("Player not found");

    let direction = game.direction;
    let nextPlayerTurnOrder;

    if (card.type === "reverse") {
      direction =
        game.direction === "clockwise" ? "counter_clockwise" : "clockwise";

      if (game.players.length === 2) {
        nextPlayerTurnOrder = currentPlayer.turnOrder;
      } else {
        nextPlayerTurnOrder =
          direction === "clockwise"
            ? currentPlayer.turnOrder === 1
              ? game.players.length
              : currentPlayer.turnOrder - 1
            : currentPlayer.turnOrder === game.players.length
              ? 1
              : currentPlayer.turnOrder + 1;
      }
    } else if (card.type === "skip") {
      if (game.players.length === 2) {
        nextPlayerTurnOrder = currentPlayer.turnOrder;
      } else {
        nextPlayerTurnOrder =
          direction === "clockwise"
            ? currentPlayer.turnOrder === game.players.length
              ? 2
              : currentPlayer.turnOrder + 2 > game.players.length
                ? 1
                : currentPlayer.turnOrder + 2
            : currentPlayer.turnOrder <= 2
              ? currentPlayer.turnOrder === 1
                ? game.players.length - 1
                : game.players.length
              : currentPlayer.turnOrder - 2;
      }
    } else if (card.type === "draw_two" || card.type === "wild_draw_four") {
      const nextPlayerToDraw =
        direction === "clockwise"
          ? currentPlayer.turnOrder === game.players.length
            ? game.players.find((p) => p.turnOrder === 1)
            : game.players.find(
                (p) => p.turnOrder === currentPlayer.turnOrder + 1,
              )
          : currentPlayer.turnOrder === 1
            ? game.players.find((p) => p.turnOrder === game.players.length)
            : game.players.find(
                (p) => p.turnOrder === currentPlayer.turnOrder - 1,
              );

      if (!nextPlayerToDraw) throw new Error("Next player not found");

      if (card.type === "draw_two") {
        await drawCard({ gameId, playerId: nextPlayerToDraw.id });
        await drawCard({ gameId, playerId: nextPlayerToDraw.id });
      } else {
        for (let i = 0; i < 4; i++) {
          await drawCard({ gameId, playerId: nextPlayerToDraw.id });
        }
      }

      if (game.players.length === 2) {
        nextPlayerTurnOrder = currentPlayer.turnOrder;
      } else {
        nextPlayerTurnOrder =
          direction === "clockwise"
            ? nextPlayerToDraw.turnOrder === game.players.length
              ? 1
              : nextPlayerToDraw.turnOrder + 1
            : nextPlayerToDraw.turnOrder === 1
              ? game.players.length
              : nextPlayerToDraw.turnOrder - 1;
      }
    } else {
      nextPlayerTurnOrder =
        direction === "clockwise"
          ? currentPlayer.turnOrder === game.players.length
            ? 1
            : currentPlayer.turnOrder + 1
          : currentPlayer.turnOrder === 1
            ? game.players.length
            : currentPlayer.turnOrder - 1;
    }

    const nextPlayer = game.players.find(
      (p) => p.turnOrder === nextPlayerTurnOrder,
    );
    if (!nextPlayer) throw new Error("Next player not found");

    await tx
      .update(games)
      .set({
        currentTurn: nextPlayer.userId,
        direction,
      })
      .where(eq(games.id, gameId));

    const currentPlayerHands = await tx.query.playerHands.findMany({
      where: (playerHands, { eq }) => eq(playerHands.playerId, playerId),
    });

    if (currentPlayerHands.length === 0) {
      await tx
        .update(games)
        .set({ status: "finished" })
        .where(eq(games.id, gameId));
    }

    revalidatePath(`/game/${gameId}`);
  });
}

export async function callUno({
  gameId,
  playerId,
}: {
  gameId: number;
  playerId: number;
}) {
  const currentUser = await getCurrentUser();

  const currentPlayer = await db.query.players.findFirst({
    where: (players, { and, eq }) =>
      and(eq(players.gameId, gameId), eq(players.userId, currentUser.id)),
    with: {
      playerHands: true,
    },
  });

  if (!currentPlayer) {
    throw new Error("Player not found");
  }

  const unoPlayer = await db.query.players.findFirst({
    where: (players, { and, eq }) =>
      and(eq(players.gameId, gameId), eq(players.id, playerId)),
    with: {
      playerHands: true,
    },
  });

  if (!unoPlayer) {
    throw new Error("Player not found");
  }

  if (currentPlayer.userId === unoPlayer.userId) {
    if (currentPlayer.playerHands.length === 1) {
      await db
        .update(players)
        .set({ hasCalledUno: true })
        .where(eq(players.id, playerId));
    }
  } else {
    if (unoPlayer.playerHands.length === 1 && !unoPlayer.hasCalledUno) {
      await drawCard({ gameId, playerId });
      await drawCard({ gameId, playerId });
    }
  }

  revalidatePath(`/game/${gameId}`);
}
