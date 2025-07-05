
"use client"

import type { Product } from "@/lib/types"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProductFormDialog } from "./product-form-dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ImportButton } from "./import-button"
import { ExportButton } from "./export-button"

interface ProductsClientPageProps {
    products: Product[];
}

export function ProductsClientPage({ products }: ProductsClientPageProps) {
    const isMobile = useIsMobile()

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2 flex-wrap">
                <ImportButton />
                <ExportButton products={products} />
                {/* Only render the header "Add Product" button on non-mobile devices */}
                {isMobile === false && (
                    <ProductFormDialog>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Produk
                        </Button>
                    </ProductFormDialog>
                )}
            </div>
            <DataTable columns={columns} data={products} />
            {/* Only render the FAB on mobile devices */}
            {isMobile === true && (
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
