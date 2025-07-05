"use client"

import { useState } from "react";
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
import { ReceiptText, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSale } from "./actions";

interface SalesHistoryListProps {
  sales: Sale[];
}

export function SalesHistoryList({ sales: initialSales }: SalesHistoryListProps) {
  const [sales, setSales] = useState(initialSales);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
  };

  const handleConfirmDelete = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteSale(saleToDelete);
      if (result.success) {
        toast({
          title: "Sukses",
          description: result.message,
        });
        setSales(sales.filter(s => s.id !== saleToDelete.id));
        setSaleToDelete(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus transaksi.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
    <>
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
                <AccordionTrigger className="hover:bg-accent/50 px-4 rounded-md transition-colors group">
                  <div className="flex justify-between items-center w-full pr-4">
                    <div className="text-left">
                      <p className="font-semibold">
                        {format(new Date(sale.date), "d MMMM yyyy, HH:mm", { locale: id })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sale.items.length} jenis produk
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="font-bold text-lg text-primary">{formatCurrency(sale.total)}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteClick(sale);
                            }}
                            aria-label="Hapus Transaksi"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
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
      
      <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus transaksi penjualan dan mengembalikan stok produk yang terjual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Menghapus..." : "Hapus Transaksi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
