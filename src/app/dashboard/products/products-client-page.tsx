
"use client"

import * as React from "react"
import type { Product } from "@/lib/types"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProductFormDialog } from "./product-form-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ImportButton } from "./import-button"
import { ExportButton } from "./export-button"
import { useAuth } from "@/hooks/use-auth"
import type { ColumnDef } from "@tanstack/react-table"

interface ProductsClientPageProps {
    products: Product[];
}

export function ProductsClientPage({ products }: ProductsClientPageProps) {
    const isMobile = useIsMobile()
    const { user } = useAuth()
    const userRole = user?.role

    const visibleColumns = React.useMemo(() => {
        if (userRole === 'admin') {
            return columns;
        }
        return columns.filter(col => 
            col.id !== 'select' && 
            col.id !== 'actions' && 
            col.accessorKey !== 'costPrice'
        );
    }, [userRole]) as ColumnDef<Product>[];

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 flex-wrap">
                {userRole === 'admin' && <ImportButton />}
                <ExportButton products={products} />
                {userRole === 'admin' && !isMobile && (
                    <ProductFormDialog>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Produk
                        </Button>
                    </ProductFormDialog>
                )}
            </div>
            <DataTable 
              columns={visibleColumns} 
              data={products} 
              userRole={userRole}
              filterColumnId="name"
              filterPlaceholder="Filter produk..."
            />
            {userRole === 'admin' && isMobile && (
                <ProductFormDialog>
                    <Button
                        className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20"
                        size="icon"
                    >
                        <PlusCircle className="h-7 w-7" />
                        <span className="sr-only">Tambah Produk</span>
                    </Button>
                </ProductFormDialog>
            )}
        </div>
    )
}
