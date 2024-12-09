import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getLobbyUsers } from "../actions";

export async function Users() {
  const lobbyUsers = await getLobbyUsers();

  return (
    <div className="min-h-[400px]">
      <DataTable columns={columns} data={lobbyUsers} />
    </div>
  );
}
