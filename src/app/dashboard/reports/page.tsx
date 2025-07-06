
import { getExpenses } from "../expenses/actions";
import { getProducts } from "../products/actions";
import { getSalesHistory } from "./actions";
import { ReportsClientPage } from "./reports-client-page";

export default async function ReportsPage() {
  const products = await getProducts();
  const sales = await getSalesHistory();
  const expenses = await getExpenses();

  return <ReportsClientPage initialSales={sales} products={products} initialExpenses={expenses} />;
}
