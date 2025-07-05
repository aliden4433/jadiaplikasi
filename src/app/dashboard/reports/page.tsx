import { DollarSign, Package, ShoppingBag, Users } from "lucide-react"
import { sales, products } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BestsellersChart } from "./charts"
import type { CartItem } from "@/lib/types"

function getTodaysSalesStats() {
  const today = new Date().toISOString().split('T')[0];
  const todaysSales = sales.filter(sale => sale.date.startsWith(today));
  
  const revenue = todaysSales.reduce((acc, sale) => acc + sale.total, 0);
  const count = todaysSales.length;

  return { revenue, count };
}

function getBestsellers() {
  const itemCounts: { [key: string]: number } = {};

  sales.forEach(sale => {
    sale.items.forEach((item: CartItem) => {
      if (itemCounts[item.product.name]) {
        itemCounts[item.product.name] += item.quantity;
      } else {
        itemCounts[item.product.name] = item.quantity;
      }
    });
  });

  return Object.entries(itemCounts)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export default function ReportsPage() {
  const { revenue: todaysRevenue, count: todaysSalesCount } = getTodaysSalesStats();
  const bestsellers = getBestsellers();

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todaysRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">from {todaysSalesCount} sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (All Time)</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sales.length}</div>
            <p className="text-xs text-muted-foreground">Total transactions recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Products in catalog</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Best Selling Items</CardTitle>
        </CardHeader>
        <CardContent>
          <BestsellersChart data={bestsellers} />
        </CardContent>
      </Card>
    </div>
  )
}
