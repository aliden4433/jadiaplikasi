import { getExpenses } from "../expenses/actions";
import { getSalesHistory } from "../reports/actions";
import { SalesHistoryList } from "./sales-history-list";

export default async function SalesHistoryPage() {
  const sales = await getSalesHistory();
  const expenses = await getExpenses();
  return <SalesHistoryList sales={sales} expenses={expenses} />;
}
