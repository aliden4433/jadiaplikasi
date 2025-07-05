
"use client"

import { useState, useMemo, useEffect } from "react";
import type { Sale } from "@/lib/types";
import { format, addDays } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ReceiptText, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { deleteSale } from "./actions";
import { ExportSalesButton } from "./export-sales-button";
import { cn } from "@/lib/utils";

interface SalesHistoryListProps {
  sales: Sale[];
}

export function SalesHistoryList({ sales: initialSales }: SalesHistoryListProps) {
  const [sales, setSales] = useState(initialSales);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    // Default to last 30 days
    setDate({
      from: addDays(new Date(), -29),
      to: new Date(),
    })
  }, [])
  
  const filteredSales = useMemo(() => {
    if (!date?.from) return []

    const fromDate = date.from;
    const toDate = date.to ? addDays(date.to, 1) : addDays(fromDate, 1);
    
    // Set time to beginning and end of day for accurate comparison
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    return sales.filter(sale => {
      const saleDate = new Date(sale.date)
      saleDate.setHours(0,0,0,0);
      return saleDate >= fromDate && saleDate < toDate
    })
  }, [sales, date])

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

  if (initialSales.length === 0) {
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>Riwayat Transaksi</CardTitle>
                <CardDescription>
                  Berikut adalah daftar transaksi yang telah tercatat.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full sm:w-[260px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>
                              {format(date.from, "LLL dd, y")} -{" "}
                              {format(date.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(date.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  <ExportSalesButton sales={filteredSales} />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length > 0 ? (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {filteredSales.map((sale) => (
                  <AccordionItem value={sale.id} key={sale.id} className="border-b-0 rounded-lg border overflow-hidden bg-card">
                    <AccordionTrigger className="hover:bg-accent/50 px-4 transition-colors group data-[state=open]:bg-accent/50">
                      <div className="flex justify-between items-center w-full pr-4">
                        <div className="text-left">
                          <p className="font-semibold">
                            {sale.transactionId || 'No ID'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(sale.date), "d MMM yyyy, HH:mm", { locale: id })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-base text-primary">{formatCurrency(sale.total)}</p>
                            <Button
                                asChild
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
                                <span>
                                  <Trash2 className="h-4 w-4" />
                                </span>
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
                        {sale.profit !== undefined && (
                            <div className="flex justify-between text-sm text-green-600 dark:text-green-500 pt-1">
                                <p className="font-medium">Keuntungan</p>
                                <p className="font-medium">{formatCurrency(sale.profit)}</p>
                            </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
          ) : (
             <div className="text-center text-muted-foreground py-10">
                <p>Tidak ada transaksi untuk rentang tanggal yang dipilih.</p>
            </div>
          )}
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
