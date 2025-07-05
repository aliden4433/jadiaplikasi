"use client"

import { ColumnDef } from "@tanstack/react-table"

import type { Product } from "@/lib/types"
import { ProductRowActions } from "./product-row-actions"

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "price",
    header: "Harga Jual",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "costPrice",
    header: "Harga Modal",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("costPrice"))
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "stock",
    header: "Stok",
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => <ProductRowActions product={row.original} />,
  },
]
