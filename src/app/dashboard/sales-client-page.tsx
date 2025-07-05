"use client"

import { useState, useMemo } from "react"
import { Package, Trash2, ShoppingCart } from "lucide-react"

import type { CartItem, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PaymentDialog } from "@/components/payment-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"

interface SalesClientPageProps {
  products: Product[]
}

export function SalesClientPage({ products }: SalesClientPageProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0) // Percentage
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("name-asc")
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortOrder) {
          case "name-asc":
            return a.name.localeCompare(b.name)
          case "name-desc":
            return b.name.localeCompare(a.name)
          case "price-asc":
            return a.price - b.price
          case "price-desc":
            return b.price - a.price
          default:
            return 0
        }
      })
  }, [products, searchTerm, sortOrder])


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
    toast({
      title: "Produk Ditambahkan",
      description: `${product.name} telah ditambahkan ke keranjang.`,
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
  const totalItemsInCart = cart.reduce((acc, item) => acc + item.quantity, 0)

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

  const CartTrigger = (
    <Button
      className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20"
      size="icon"
    >
      <ShoppingCart className="h-7 w-7" />
      <span className="sr-only">Keranjang Belanja</span>
      {totalItemsInCart > 0 && (
        <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full">
          {totalItemsInCart}
        </Badge>
      )}
    </Button>
  );

  const CartItems = (
    <div className="flex-grow overflow-y-auto">
      <div className="p-4">
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
      </div>
    </div>
  );

  const CartSummary = (
    <>
      {cart.length > 0 && (
        <>
          <Separator />
          <div className="p-4 space-y-2">
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
          </div>
          <CardFooter className="p-4 pt-0">
            <Button className="w-full" onClick={() => setPaymentDialogOpen(true)} disabled={total <= 0}>
              Proses Pembayaran
            </Button>
          </CardFooter>
        </>
      )}
    </>
  );

  if (isMobile === undefined) {
    return (
       <div className="relative min-h-[calc(100vh-8rem)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <CardTitle>Produk</CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input placeholder="Cari produk..." className="w-full md:w-64" />
                    <Select>
                        <SelectTrigger className="w-full md:w-[220px]">
                            <SelectValue placeholder="Urutkan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                            <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                            <SelectItem value="price-asc">Harga (Rendah ke Tinggi)</SelectItem>
                            <SelectItem value="price-desc">Harga (Tinggi ke Rendah)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Products rendered here to avoid layout shift */}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Produk</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Input
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64"
                />
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Harga (Rendah ke Tinggi)</SelectItem>
                    <SelectItem value="price-desc">Harga (Tinggi ke Rendah)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredAndSortedProducts.map((product) => (
            <Card
              key={product.id}
              className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => addToCart(product)}
            >
              <div className="p-3 flex flex-col flex-grow justify-between">
                  <p className="font-semibold text-sm line-clamp-3">{product.name}</p>
                  <p className="text-sm text-muted-foreground mt-2 self-end font-medium">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price)}
                  </p>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>
      
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent side="bottom" className="w-full rounded-t-lg p-0 flex flex-col max-h-[80vh]">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>Pesanan Saat Ini</SheetTitle>
            </SheetHeader>
            {CartItems}
            {CartSummary}
          </SheetContent>
        </Sheet>
      ) : (
        <Popover>
          <PopoverTrigger asChild>{CartTrigger}</PopoverTrigger>
          <PopoverContent className="w-96 mr-4 mb-2 p-0 flex flex-col max-h-[80vh]" side="top" align="end">
            <CardHeader className="p-4">
              <CardTitle>Pesanan Saat Ini</CardTitle>
            </CardHeader>
            <div className="flex-grow overflow-y-auto max-h-96">
                {CartItems}
            </div>
            {CartSummary}
          </PopoverContent>
        </Popover>
      )}

      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        total={total}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
