"use client"

import type { Sale } from "@/lib/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReceiptText } from "lucide-react";

interface SalesHistoryListProps {
  sales: Sale[];
}

export function SalesHistoryList({ sales }: SalesHistoryListProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground flex flex-col items-center gap-4">
          <ReceiptText className="w-16 h-16" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">Belum ada riwayat penjualan.</p>
            <p>Selesaikan transaksi di halaman Penjualan untuk melihat riwayat di sini.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semua Transaksi</CardTitle>
        <CardDescription>
          Berikut adalah daftar semua transaksi yang telah tercatat, diurutkan dari yang terbaru.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {sales.map((sale) => (
            <AccordionItem value={sale.id} key={sale.id}>
              <AccordionTrigger className="hover:bg-accent/50 px-4 rounded-md transition-colors">
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="text-left">
                    <p className="font-semibold">
                      {format(new Date(sale.date), "d MMMM yyyy, HH:mm", { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sale.items.length} jenis produk
                    </p>
                  </div>
                  <p className="font-bold text-lg text-primary">{formatCurrency(sale.total)}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-2 pb-4 bg-secondary/30 border-t">
                <div className="space-y-3 pt-3">
                  {sale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                  <Separator className="my-2 bg-border/80" />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <p>Subtotal</p>
                      <p>{formatCurrency(sale.subtotal)}</p>
                    </div>
                     <div className="flex justify-between text-sm">
                      <p>Diskon</p>
                      <p className="text-destructive">-{formatCurrency(sale.discount)}</p>
                    </div>
                  </div>
                  <Separator className="my-2 bg-border/80" />
                  <div className="flex justify-between font-semibold text-base">
                    <p>Total</p>
                    <p>{formatCurrency(sale.total)}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
