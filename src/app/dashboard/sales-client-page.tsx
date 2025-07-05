"use client"

import { useState } from "react"
import { Package, PlusCircle, Trash2 } from "lucide-react"

import type { CartItem, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PaymentDialog } from "@/components/payment-dialog"

interface SalesClientPageProps {
  products: Product[]
}

export function SalesClientPage({ products }: SalesClientPageProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0) // Percentage
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const { toast } = useToast()

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false)
    toast({
      title: "Pembayaran Berhasil",
      description: "Transaksi telah berhasil diselesaikan.",
    })
    setCart([])
    setDiscount(0)
  }

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (isNaN(value)) {
      setDiscount(0)
    } else {
      setDiscount(Math.max(0, Math.min(100, value)))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Produk</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardContent className="p-2 flex-grow">
                   <div className="aspect-square w-full bg-secondary rounded-md flex items-center justify-center">
                    <Package className="w-1/2 h-1/2 text-muted-foreground" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start p-2 pt-0">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => addToCart(product)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Saat Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada item di keranjang.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(item.product.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id!, parseInt(e.target.value))}
                        className="w-16 h-8 text-center"
                        min="1"
                      />
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.product.id!)}>
                        <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {cart.length > 0 && (
            <>
              <Separator />
              <CardContent className="space-y-2 pt-6">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(subtotal)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Diskon</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={discount}
                      onChange={handleDiscountChange}
                      className="w-20 h-8 text-right"
                      min="0"
                      max="100"
                    />
                    <span>%</span>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <p>Potongan Diskon</p>
                    <p>-{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(discountAmount)}</p>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <p>Total</p>
                  <p>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(total)}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setPaymentDialogOpen(true)} disabled={total < 0}>
                  Proses Pembayaran
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={total}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
