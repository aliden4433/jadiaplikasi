"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Smartphone } from "lucide-react"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  total: number
  onPaymentSuccess: () => void
}

export function PaymentDialog({ open, onOpenChange, total, onPaymentSuccess }: PaymentDialogProps) {
  const formattedTotal = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Selesaikan Pembayaran</DialogTitle>
          <DialogDescription>
            Jumlah total yang harus dibayar: <span className="font-bold text-foreground">{formattedTotal}</span>
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card">
              <CreditCard className="mr-2 h-4 w-4" /> Kartu
            </TabsTrigger>
            <TabsTrigger value="mobile">
              <Smartphone className="mr-2 h-4 w-4" /> QRIS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="card">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="card-name">Nama di Kartu</Label>
                <Input id="card-name" placeholder="John Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-number">Nomor Kartu</Label>
                <Input id="card-number" placeholder="**** **** **** 1234" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expiry-date">Kedaluwarsa</Label>
                  <Input id="expiry-date" placeholder="BB/TT" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="mobile">
            <div className="grid gap-4 py-4 place-items-center">
              <img src="https://placehold.co/250x250.png" alt="QR Code" data-ai-hint="QR code" />
              <p className="text-sm text-muted-foreground">Pindai kode QR untuk membayar.</p>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" onClick={onPaymentSuccess}>
            Bayar {formattedTotal}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
