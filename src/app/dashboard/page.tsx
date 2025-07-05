"use client"

import { useState } from "react"
import Image from "next/image"
import { PlusCircle, Trash2, X } from "lucide-react"

import type { CartItem, Product } from "@/lib/types"
import { products } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { PaymentDialog } from "@/components/payment-dialog"

export default function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)
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
  const total = subtotal - discount

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    toast({
      title: "Payment Successful",
      description: "The transaction has been completed.",
    });
    // Reset state
    setCart([]);
    setDiscount(0);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardContent className="p-2 flex-grow">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={150}
                    height={150}
                    className="w-full h-auto object-cover rounded-md"
                    data-ai-hint={`${product.category} ${product.name}`}
                  />
                </CardContent>
                <CardFooter className="flex flex-col items-start p-2 pt-0">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => addToCart(product)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
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
            <CardTitle>Current Order</CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-muted-foreground">No items in the cart.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        width={40}
                        height={40}
                        className="rounded-md"
                        data-ai-hint={`${item.product.category} ${item.product.name}`}
                      />
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                        className="w-16 h-8 text-center"
                        min="1"
                      />
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(item.product.id)}>
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
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Discount</p>
                  <div className="flex items-center gap-2">
                    <span>$</span>
                    <Input 
                      type="number" 
                      value={discount} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-24 h-8" 
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <p>Total</p>
                  <p>${total.toFixed(2)}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setPaymentDialogOpen(true)} disabled={total <= 0}>
                  Process Payment
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
