import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { unstable_cache as cache } from "next/cache";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const getUsers = cache(
  async () => {
    return await db.query.users.findMany({
      columns: {
        username: true,
        name: true,
      },
      where: (users, { exists }) =>
        exists(
          db
            .select()
            .from(sessions)
            .where(
              and(
                eq(sessions.userId, users.id),
                gt(sessions.expiresAt, new Date()),
              ),
            ),
        ),
    });
  },
  ["users"],
  { revalidate: 60, tags: ["users"] },
);

export async function Users() {
  const users = await getUsers();

  return (
    <div className="min-h-[400px]">
      <DataTable columns={columns} data={users} />
    </div>
  );
}
