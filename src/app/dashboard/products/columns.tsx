"use client"

import { ColumnDef } from "@tanstack/react-table"
import Image from "next/image"

import type { Product } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { ProductRowActions } from "./product-row-actions"

export const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "image",
    header: "Gambar",
    cell: ({ row }) => {
      const product = row.original
      return (
        <Image
          src={product.image}
          alt={product.name}
          width={40}
          height={40}
          className="rounded-md object-cover"
          data-ai-hint={`${product.category} ${product.name}`}
        />
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
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
