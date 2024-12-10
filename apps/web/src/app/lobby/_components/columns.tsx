"use client";

import { type ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<{
  username: string;
  name: string;
  gamesPlayed: number;
  wins: number;
}>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "gamesPlayed",
    header: "Games Played",
  },
  {
    accessorKey: "wins",
    header: "Wins",
  },
];
