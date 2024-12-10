"use server";

import { db } from "@/server/db";
import {
  chats,
  gameChats,
  games,
  playerHands,
  players,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { gameChatSchema } from "./schemas";
import { getCurrentUser } from "@/server/db/context";
import { redirect } from "next/navigation";

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

    try {
      await notifyGameUpdate(gameId);
    } catch (error) {
      console.error("Failed to notify game update:", error);
    }

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
  gameChatSchema.parse({ message });

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
  await db.transaction(async (tx) => {
    const game = await tx.query.games.findFirst({
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
      await tx
        .update(players)
        .set({ hasCalledUno: false })
        .where(eq(players.id, playerId));
    }

    const cards = await tx.query.cards.findMany();
    const playerCards = player.playerHands.map((hand) => hand.card);
    const deck = cards.filter(
      (card) => !playerCards.some((playerCard) => playerCard.id === card.id),
    );
    const randomIndex = Math.floor(Math.random() * deck.length);
    const drawnCard = deck[randomIndex];

    if (!drawnCard) {
      throw new Error("No card found");
    }

    await tx.insert(playerHands).values({
      playerId,
      cardId: drawnCard.id,
    });

    try {
      await notifyGameUpdate(gameId);
    } catch (error) {
      console.error("Failed to notify game update:", error);
    }

    revalidatePath(`/game/${gameId}`);
  });
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

    try {
      await notifyGameUpdate(gameId);
    } catch (error) {
      console.error("Failed to notify game update:", error);
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

  try {
    await notifyGameUpdate(gameId);
  } catch (error) {
    console.error("Failed to notify game update:", error);
  }

  revalidatePath(`/game/${gameId}`);
}

export async function getPlayers({ gameId }: { gameId: number }) {
  return await db.query.players.findMany({
    where: (players, { eq }) => eq(players.gameId, gameId),
    with: {
      user: true,
      playerHands: true,
    },
  });
}

export async function getGame({ gameId }: { gameId: number }) {
  const game = await db.query.games.findFirst({
    columns: {
      id: true,
      name: true,
      status: true,
      currentTurn: true,
    },
    with: {
      players: {
        with: {
          playerHands: {
            with: {
              card: true,
            },
            orderBy: (card, { asc }) => [asc(card.cardId)],
          },
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      users: {
        columns: {
          id: true,
        },
      },
      card: true, // top card
    },
    where: (games, { eq }) => eq(games.id, gameId),
  });

  if (!game) {
    redirect("/lobby");
  }

  return game;
}

async function notifyGameUpdate(gameId: number) {
  const ws = new WebSocket(`ws://localhost:8080/game-update?gameId=${gameId}`);

  return new Promise<void>((resolve, reject) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ gameId: gameId.toString() }));
      ws.close();
      resolve();
    };

    ws.onerror = (event: Event) => {
      ws.close();
      reject(new Error("WebSocket error occurred: " + JSON.stringify(event)));
    };

    setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 5000);
  });
}

export { notifyGameUpdate };
