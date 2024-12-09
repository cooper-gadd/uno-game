import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username must be at least 1 character" })
    .max(256, { message: "Username must be less than 256 characters" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(256, { message: "Password must be less than 256 characters" }),
});
