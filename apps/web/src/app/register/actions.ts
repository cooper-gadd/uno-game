"use server";

import { env } from "@/env";
import { db } from "@/server/db";
import { sessions, users, type CreateUser } from "@/server/db/schema";
import bcrypt from "bcrypt";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";
import { registerSchema } from "./schemas";

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
    nonce.timestamp.getTime() + 1000 * 60 * 5 < timestamp.getTime()
  ) {
    throw new Error("Invalid nonce");
  }

  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, createUser.username),
  });

  if (existingUser) {
    throw new Error("Username already exists");
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
