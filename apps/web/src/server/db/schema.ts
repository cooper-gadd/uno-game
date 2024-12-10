import {
  type InferInsertModel,
  type InferSelectModel,
  relations,
} from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTableCreator,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `uno_${name}`);

export const users = createTable(
  "user",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    username: varchar("username", { length: 256 }).unique().notNull(),
    password: varchar("password", { length: 256 }).notNull(),
  },
  (table) => {
    return {
      indexOnUsername: index("user_username_index").on(table.username),
      indexOnPassword: index("user_password_index").on(table.password),
    };
  },
);

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  players: many(players),
}));

export type CreateUser = InferInsertModel<typeof users>;
export type User = InferSelectModel<typeof users>;
export type UpdateUser = Partial<CreateUser>;

export const sessions = createTable(
  "session",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: integer("user_id")
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      })
      .notNull(),
    token: varchar("token", { length: 250 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => {
    return {
      indexOnToken: index("session_token_index").on(table.token),
    };
  },
);

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export type CreateSession = InferInsertModel<typeof sessions>;
export type Session = InferSelectModel<typeof sessions>;
export type UpdateSession = Partial<CreateSession>;

export const cardColor = pgEnum("color", [
  "red",
  "green",
  "blue",
  "yellow",
  "wild",
]);

export const cardType = pgEnum("type", [
  "number",
  "draw_two",
  "reverse",
  "skip",
  "wild",
  "wild_draw_four",
]);

export const cards = createTable(
  "card",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    color: cardColor("color").notNull(),
    type: cardType("type").notNull(),
    value: integer("value"),
  },
  (table) => {
    return {
      indexOnId: index("card_id_index").on(table.id),
    };
  },
);

export const cardRelations = relations(cards, ({ many }) => ({
  playerHands: many(playerHands),
}));

export type Card = InferSelectModel<typeof cards>;
export type CreateCard = InferInsertModel<typeof cards>;
export type UpdateCard = Partial<CreateCard>;

export const gameDirection = pgEnum("direction", [
  "clockwise",
  "counter_clockwise",
]);

export const gameStatus = pgEnum("status", ["waiting", "active", "finished"]);

export const games = createTable("game", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by")
    .references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  maxPlayers: integer("max_players").notNull(),
  topCardId: integer("top_card_id")
    .references(() => cards.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .default(1),
  direction: gameDirection("direction").default("clockwise").notNull(),
  status: gameStatus("status").default("waiting").notNull(),
  currentTurn: integer("current_turn"),
});

export const gameRelations = relations(games, ({ one, many }) => ({
  users: one(users, {
    fields: [games.createdBy],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [games.topCardId],
    references: [cards.id],
  }),
  players: many(players),
  gameChats: many(gameChats),
}));

export type CreateGame = InferInsertModel<typeof games>;
export type Game = InferSelectModel<typeof games>;
export type UpdateGame = Partial<CreateGame>;

export const players = createTable("player", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  gameId: integer("game_id")
    .references(() => games.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  turnOrder: integer("turn_order").notNull(),
  hasCalledUno: boolean("has_called_uno").notNull().default(false),
});

export const playerRelations = relations(players, ({ one, many }) => ({
  user: one(users, {
    fields: [players.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [players.gameId],
    references: [games.id],
  }),
  playerHands: many(playerHands),
}));

export type CreatePlayer = InferInsertModel<typeof players>;
export type Player = InferSelectModel<typeof players>;
export type UpdatePlayer = Partial<CreatePlayer>;

export const playerHands = createTable("player_hand", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  playerId: integer("player_id")
    .references(() => players.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  cardId: integer("card_id")
    .references(() => cards.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
});

export const playerHandRelations = relations(playerHands, ({ one }) => ({
  player: one(players, {
    fields: [playerHands.playerId],
    references: [players.id],
  }),
  card: one(cards, {
    fields: [playerHands.cardId],
    references: [cards.id],
  }),
}));

export type CreatePlayerHand = InferInsertModel<typeof playerHands>;
export type PlayerHand = InferSelectModel<typeof playerHands>;
export type UpdatePlayerHand = Partial<CreatePlayerHand>;

export const chats = createTable("chat", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id")
    .references(() => users.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const chatRelations = relations(chats, ({ one }) => ({
  user: one(users, {
    fields: [chats.userId],
    references: [users.id],
  }),
}));

export type CreateChat = InferInsertModel<typeof chats>;
export type Chat = InferSelectModel<typeof chats>;
export type UpdateChat = Partial<CreateChat>;

export const gameChats = createTable("game_chat", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  gameId: integer("game_id")
    .references(() => games.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
  chatId: integer("chat_id")
    .references(() => chats.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    })
    .notNull(),
});

export const gameChatRelations = relations(gameChats, ({ one }) => ({
  game: one(games, {
    fields: [gameChats.gameId],
    references: [games.id],
  }),
  chat: one(chats, {
    fields: [gameChats.chatId],
    references: [chats.id],
  }),
}));

export type CreateGameChat = InferInsertModel<typeof gameChats>;
export type GameChat = InferSelectModel<typeof gameChats>;
export type UpdateGameChat = Partial<CreateGameChat>;
