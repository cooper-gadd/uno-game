import { db } from "@/server/db";
import { sessions } from "@/server/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { columns } from "./columns";
import { DataTable } from "./data-table";

export async function Users() {
  const users = await db.query.users.findMany({
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

  return (
    <div className="min-h-[400px]">
      <DataTable columns={columns} data={users} />
    </div>
  );
}
