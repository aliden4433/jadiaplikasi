
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { ExpenseRowActions } from "./expense-row-actions";
import { Badge } from "@/components/ui/badge";

export const getColumns = (categories: ExpenseCategoryDoc[]): ColumnDef<Expense>[] => [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tanggal
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return (
        <div className="font-medium">
          {format(date, "d MMM yyyy", { locale: id })}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Kategori
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <Badge variant="outline">{row.getValue("category")}</Badge>,
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => {
        return <div className="text-left">{row.getValue("description")}</div>
    }
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Jumlah
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "recordedBy",
    header: "Dicatat oleh",
    cell: ({ row }) => {
      const recordedBy = row.original.recordedBy;
      return <div className="text-left truncate">{recordedBy?.email || "N/A"}</div>;
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="text-right">
          <ExpenseRowActions expense={expense} categories={categories} />
        </div>
      );
    },
    enableSorting: false,
  },
];
