
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Product } from "@/lib/types"

interface ProductVariantDialogProps {
  productGroup: Product[] | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart: (product: Product, quantity?: number, showToast?: boolean) => void
}

export function ProductVariantDialog({ productGroup, open, onOpenChange, onAddToCart }: ProductVariantDialogProps) {
  if (!productGroup) return null

  const baseName = productGroup[0].name.split(" - ")[0]

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, 1, true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Varian untuk {baseName}</DialogTitle>
          <DialogDescription>
            Produk ini memiliki beberapa varian. Silakan pilih salah satu untuk ditambahkan ke keranjang.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
          {productGroup.map(variant => {
            const nameParts = variant.name.split(" - ");
            const variantName = nameParts.length > 1 ? nameParts.slice(1).join(" - ") : baseName;

            return (
              <div key={variant.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <div>
                  <p className="font-medium">{variantName}</p>
                  <p className="text-sm text-muted-foreground">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(variant.price)}</p>
                </div>
                <Button onClick={() => handleAddToCart(variant)} size="sm">Tambah</Button>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
