import { z } from "zod";

export const gameSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name must be at least 1 character" })
    .max(256, { message: "Name must be less than 256 characters" }),
  maxPlayers: z
    .number()
    .int()
    .min(2, { message: "Must have at least 2 players" })
    .max(4, { message: "Must have at most 4 players" }),
});

export const chatSchema = z.object({
  message: z
    .string()
    .min(1, { message: "Message must be at least 1 character" })
    .max(256, { message: "Message must be less than 256 characters" }),
});
