"use client";

import { type ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<{
  name: string;
  username: string;
}>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
];
