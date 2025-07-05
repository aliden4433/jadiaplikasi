import { getSalesHistory } from "../reports/actions";
import { SalesHistoryList } from "./sales-history-list";

export default async function SalesHistoryPage() {
  const sales = await getSalesHistory();
  return <SalesHistoryList sales={sales} />;
}
