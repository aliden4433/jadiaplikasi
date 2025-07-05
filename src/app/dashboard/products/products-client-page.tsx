"use client"

import type { Product } from "@/lib/types"
import { columns } from "./columns"
import { DataTable } from "./data-table"

interface ProductsClientPageProps {
    products: Product[];
}

export function ProductsClientPage({ products }: ProductsClientPageProps) {
    return (
        <DataTable columns={columns} data={products} />
    )
}
