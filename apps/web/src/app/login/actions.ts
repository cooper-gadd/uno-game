"use server";

import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { v4 as uuid } from "uuid";
import { loginSchema } from "./schemas";

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
