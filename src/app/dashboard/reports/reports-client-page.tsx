
"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { DateRange } from "react-day-picker"
import { addDays, format } from "date-fns"
import { Calendar as CalendarIcon, DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react"

import type { Product, Sale, SaleItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BestsellersChart } from "./charts"

interface ReportsClientPageProps {
  initialSales: Sale[]
  products: Product[]
}

export function ReportsClientPage({ initialSales, products }: ReportsClientPageProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -6), // Default to last 7 days
    to: new Date(),
  })

  const filteredSales = useMemo(() => {
    if (!date?.from) return []

    const fromDate = date.from
    // Add 1 day to the 'to' date to include the entire day in the range
    const toDate = date.to ? addDays(date.to, 1) : addDays(fromDate, 1)

    return initialSales.filter(sale => {
      const saleDate = new Date(sale.date)
      return saleDate >= fromDate && saleDate < toDate
    })
  }, [initialSales, date])

  const { revenue, count, profit } = useMemo(() => {
    const revenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0)
    const profit = filteredSales.reduce((acc, sale) => acc + (sale.profit || 0), 0)
    const count = filteredSales.length
    return { revenue, count, profit }
  }, [filteredSales])
  
  const bestsellers = useMemo(() => {
    const itemCounts: { [key: string]: number } = {}
    filteredSales.forEach(sale => {
      sale.items.forEach((item: SaleItem) => {
        if (itemCounts[item.productName]) {
          itemCounts[item.productName] += item.quantity
        } else {
          itemCounts[item.productName] = item.quantity
        }
      })
    })

    return Object.entries(itemCounts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filteredSales])


  const allTimeSalesCount = initialSales.length;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
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
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(revenue)}
            </div>
            <p className="text-xs text-muted-foreground">dari {count} penjualan di periode ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keuntungan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(profit)}
            </div>
            <p className="text-xs text-muted-foreground">Perkiraan laba bersih di periode ini</p>
          </CardContent>
        </Card>
        <Link href="/dashboard/sales-history" className="block">
          <Card className="hover:bg-accent transition-colors h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Penjualan (Semua Waktu)</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allTimeSalesCount}</div>
              <p className="text-xs text-muted-foreground">Total transaksi tercatat</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produk Aktif</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Produk dalam katalog</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Terlaris (Periode Dipilih)</CardTitle>
        </CardHeader>
        <CardContent>
          {bestsellers.length > 0 ? (
            <BestsellersChart data={bestsellers} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
                Tidak ada data penjualan untuk periode yang dipilih.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

