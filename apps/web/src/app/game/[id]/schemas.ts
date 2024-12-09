import { z } from "zod";

export const gameChatSchema = z.object({
  message: z
    .string()
    .min(1, { message: "Message must be at least 1 character" })
    .max(256, { message: "Message must be less than 256 characters" }),
});
