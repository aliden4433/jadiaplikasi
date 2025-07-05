"use client"

import { ColumnDef } from "@tanstack/react-table"

import type { Product } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { ProductRowActions } from "./product-row-actions"

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "category",
    header: "Kategori",
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    accessorKey: "price",
    header: "Harga",
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
    accessorKey: "stock",
    header: "Stok",
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => <ProductRowActions product={row.original} />,
  },
]
