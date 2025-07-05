"use client"

import { useState, useMemo, useEffect } from "react"
import { Trash2, ShoppingCart, Loader2, Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

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
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { SalesImportButton } from "./sales/sales-import-button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

interface SalesClientPageProps {
  products: Product[]
}

const getInitialDiscount = () => {
    if (typeof window === "undefined") {
      return 0; // Default for SSR
    }
    const savedDiscount = localStorage.getItem("defaultDiscount");
    return savedDiscount ? parseFloat(savedDiscount) : 0;
};

export function SalesClientPage({ products }: SalesClientPageProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0) // Percentage
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("name-asc")
  const { toast } = useToast()
  const isMobile = useIsMobile()

  // Load initial discount on client side
  useEffect(() => {
    setDiscount(getInitialDiscount());
  }, []);

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


  const addToCart = (product: Product, quantity: number = 1, showToast = true) => {
    setCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.product.id === product.id)

      if (itemInCart) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, { product, quantity, price: product.price }]
    })

    if (showToast) {
      toast({
        title: "Produk Ditambahkan",
        description: `${product.name} telah ditambahkan ke keranjang.`,
      })
    }
  }

  const handleImportSuccess = (itemsFromPdf: CartItem[]) => {
    itemsFromPdf.forEach(item => {
        addToCart(item.product, item.quantity, false);
    });
    toast({
        title: "Impor Selesai",
        description: `${itemsFromPdf.length} item produk dari PDF telah ditambahkan ke keranjang.`
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
      transactionDate: transactionDate.toISOString(),
    }

    try {
      const result = await addSale(saleData)
      if (result.success) {
        toast({
          title: "Transaksi Berhasil",
          description: result.message,
        })
        setCart([])
        setDiscount(getInitialDiscount())
        setTransactionDate(new Date())
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
                  <p className="text-xs font-medium break-words flex-grow">{item.product.name}</p>
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
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <p>Tanggal Transaksi</p>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-auto justify-start text-left font-normal",
                                !transactionDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {transactionDate ? format(transactionDate, "dd MMM yyyy") : <span>Pilih tanggal</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={transactionDate}
                            onSelect={(date) => setTransactionDate(date || new Date())}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(subtotal)}</p>
            </div>
            <div className="flex justify-between">
              <p>Diskon</p>
              <p className="font-medium">{discount}%</p>
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
                {isProcessing ? "Memproses..." : `Catat Transaksi (${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(total)})`}
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
          <CardContent className="p-0 border-t">
            {/* List rendered here to avoid layout shift */}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Produk</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <SalesImportButton onImportSuccess={handleImportSuccess} products={products} />
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
        <CardContent className="p-0 border-t flex-grow">
          <div className="divide-y divide-border h-full max-h-[calc(100vh-14rem)] overflow-y-auto">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product, 1)}
                  className="w-full text-left p-4 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset transition-colors"
                  aria-label={`Tambahkan ${product.name} ke keranjang`}
                >
                  <p className="font-medium text-sm truncate pr-4">{product.name}</p>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1 md:hidden">
                    <p>
                      Stok: {product.stock}
                    </p>
                    <p className="font-semibold text-foreground text-sm">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price)}
                    </p>
                  </div>
                   <div className="hidden md:flex justify-between items-center mt-1 text-xs text-muted-foreground">
                     <p>
                      Stok: {product.stock}
                    </p>
                     <p className="font-semibold text-sm text-foreground flex-shrink-0">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(product.price)}
                    </p>
                  </div>
                </button>
              ))
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Tidak ada produk yang cocok dengan pencarian Anda.</p>
                </div>
            )}
          </div>
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
          <PopoverContent className="w-[480px] mr-4 mb-2 p-0 flex flex-col max-h-[80vh]" side="top" align="end">
            <CardHeader className="p-4">
              <CardTitle>Pesanan Saat Ini</CardTitle>
            </CardHeader>
            <div className="flex-grow overflow-y-auto max-h-[calc(80vh-220px)]">
                {CartItems}
            </div>
            {CartSummary}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
