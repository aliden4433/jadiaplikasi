import { FileUp, PlusCircle } from "lucide-react"

import { getProducts } from "./actions"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { ProductFormDialog } from "./product-form-dialog"
import { Button } from "@/components/ui/button"
import { ExportButton } from "./export-button"
import { ImportButton } from "./import-button"

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <ImportButton />
        <ExportButton products={products} />
        <ProductFormDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </ProductFormDialog>
      </div>
      <DataTable columns={columns} data={products} />
    </div>
  )
}
