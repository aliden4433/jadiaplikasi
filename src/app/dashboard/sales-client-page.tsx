"use client"

import { useState, useMemo } from "react"
import { Package, Trash2, ShoppingCart, Loader2 } from "lucide-react"

import { addSale } from "./sales/actions"
import type { CartItem, Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { SalesImportButton } from "./sales/sales-import-button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SalesClientPageProps {
  products: Product[]
}

export function SalesClientPage({ products }: SalesClientPageProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0) // Percentage
  const [isProcessing, setIsProcessing] = useState(false)
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


  const addToCart = (product: Product, showToast = true) => {
    // This check is now redundant because of the UI disabling, but good for safety
    if (product.stock <= 0) {
      toast({
        variant: "destructive",
        title: "Stok Habis",
        description: `${product.name} sedang tidak tersedia.`,
      })
      return
    }

    const existingItem = cart.find((item) => item.product.id === product.id)
    
    if (existingItem && existingItem.quantity >= product.stock) {
      toast({
        variant: "destructive",
        title: "Stok Tidak Cukup",
        description: `Anda sudah memiliki semua ${product.stock} unit ${product.name} yang tersedia di keranjang.`,
      })
      return
    }

    setCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.product.id === product.id)
      if (itemInCart) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1, price: product.price }]
    })

    if (showToast) {
      toast({
        title: "Produk Ditambahkan",
        description: `${product.name} telah ditambahkan ke keranjang.`,
      })
    }
  }

  const handleImportSuccess = (productsFromPdf: Product[]) => {
    productsFromPdf.forEach(product => {
        addToCart(product, false); // Add to cart without showing toast for each item
    });
    toast({
        title: "Impor Selesai",
        description: `${productsFromPdf.length} item produk dari PDF telah ditambahkan ke keranjang.`
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const itemToUpdate = cart.find((item) => item.product.id === productId);
    if (!itemToUpdate) return;
    
    // Find the master product from the initial props to get the authoritative stock count
    const masterProduct = products.find(p => p.id === productId);
    if (!masterProduct) return; // Should not happen if item is in cart

    if (quantity > masterProduct.stock) {
      toast({
        variant: "destructive",
        title: "Stok Tidak Cukup",
        description: `Hanya ada ${masterProduct.stock} unit ${masterProduct.name} yang tersisa.`,
      });
      // Cap the quantity at max stock instead of just returning
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.product.id === productId ? { ...item, quantity: masterProduct.stock } : item
        )
      );
      return;
    }

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
  
  const updatePrice = (productId: string, price: number) => {
    if (isNaN(price) || price < 0) return

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, price: price } : item
      )
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount
  const totalItemsInCart = cart.reduce((acc, item) => acc + item.quantity, 0)

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (isNaN(value)) {
      setDiscount(0)
    } else {
      setDiscount(Math.max(0, Math.min(100, value)))
    }
  }

  async function handleProcessSale() {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Keranjang Kosong",
        description: "Tidak ada item untuk diproses.",
      })
      return
    }

    setIsProcessing(true)

    const saleData = {
      items: cart,
      discountPercentage: discount,
    }

    try {
      const result = await addSale(saleData)
      if (result.success) {
        toast({
          title: "Transaksi Berhasil",
          description: result.message,
        })
        setCart([])
        setDiscount(0)
      } else {
        toast({
          variant: "destructive",
          title: "Error Transaksi",
          description: result.message,
        })
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Terjadi kesalahan yang tidak terduga saat memproses transaksi.",
      })
    } finally {
      setIsProcessing(false)
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
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
            <ShoppingCart className="w-12 h-12 mb-4" />
            <p className="font-semibold">Keranjang Anda kosong.</p>
            <p className="text-sm">Klik produk untuk menambahkannya.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="space-y-2 border-b border-border pb-3 last:border-b-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium break-words flex-grow">{item.product.name}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeFromCart(item.product.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`price-${item.product.id}`} className="text-xs text-muted-foreground">Harga</Label>
                    <Input
                      id={`price-${item.product.id}`}
                      type="number"
                      value={item.price}
                      onChange={(e) => updatePrice(item.product.id!, parseFloat(e.target.value))}
                      className="w-28 h-9 text-sm"
                      step="1000"
                    />
                  </div>
                   <div className="grid gap-1.5">
                    <Label htmlFor={`qty-${item.product.id}`} className="text-xs text-muted-foreground">Jumlah</Label>
                    <Input
                      id={`qty-${item.product.id}`}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product.id!, parseInt(e.target.value))}
                      className="w-20 h-9 text-center text-sm"
                      min="1"
                    />
                  </div>
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
            <Button className="w-full" onClick={handleProcessSale} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isProcessing ? "Memproses..." : "Catat Transaksi"}
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
                <SalesImportButton onImportSuccess={handleImportSuccess} />
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
              className={cn(
                "flex flex-col transition-shadow duration-200 relative",
                product.stock > 0 ? "cursor-pointer hover:shadow-lg" : "opacity-50"
              )}
              onClick={() => product.stock > 0 && addToCart(product)}
            >
              {product.stock <= 0 && (
                <Badge variant="destructive" className="absolute top-2 right-2 z-10">Habis</Badge>
              )}
              <CardContent className="p-3 flex flex-col flex-grow justify-between">
                <p className="font-semibold text-sm line-clamp-3 pr-4">{product.name}</p>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-xs text-muted-foreground">Stok: {product.stock}</span>
                  <p className="text-sm text-foreground font-medium">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
      
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>{CartTrigger}</SheetTrigger>
          <SheetContent side="bottom" className="w-full p-0 flex flex-col h-screen">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>Pesanan Saat Ini</SheetTitle>
              <SheetDescription className="sr-only">
                Kelola item di keranjang Anda sebelum menyelesaikan transaksi.
              </SheetDescription>
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
    </div>
  )
}
