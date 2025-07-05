import { DollarSign, Package, ShoppingBag } from "lucide-react"

import { sales } from "@/lib/data"
import { getProducts } from "../products/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BestsellersChart } from "./charts"
import type { SaleItem } from "@/lib/types"

function getTodaysSalesStats() {
  const today = new Date().toISOString().split('T')[0]
  const todaysSales = sales.filter(sale => sale.date.startsWith(today))
  
  const revenue = todaysSales.reduce((acc, sale) => acc + sale.total, 0)
  const count = todaysSales.length

  return { revenue, count }
}

function getBestsellers() {
  const itemCounts: { [key: string]: number } = {}

  sales.forEach(sale => {
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
}

export default async function ReportsPage() {
  const products = await getProducts()
  const { revenue: todaysRevenue, count: todaysSalesCount } = getTodaysSalesStats()
  const bestsellers = getBestsellers()

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(todaysRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">dari {todaysSalesCount} penjualan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan (Semua Waktu)</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">Total transaksi tercatat</p>
          </CardContent>
        </Card>
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
          <CardTitle>Item Terlaris</CardTitle>
        </CardHeader>
        <CardContent>
          <BestsellersChart data={bestsellers} />
        </CardContent>
      </Card>
    </div>
  )
}
