"use server";

import { db } from "@/server/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session");

  if (!token) {
    redirect("/login");
  }

  const session = await db.query.sessions.findFirst({
    where: (sessions, { eq }) => eq(sessions.token, token.value),
    columns: {
      userId: true,
    },
  });

  if (!session) {
    redirect("/login");
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
