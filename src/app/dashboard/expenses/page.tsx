
import { getExpenses } from "./actions";
import { ExpensesClientPage } from "./expenses-client-page";

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  return <ExpensesClientPage initialExpenses={expenses} />;
}
