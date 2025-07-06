import { getExpenses } from "./actions";
import { ExpensesClientPage } from "./expenses-client-page";
import { getExpenseCategories } from "../settings/actions";

export default async function ExpensesPage() {
  const expenses = await getExpenses();
  const categories = await getExpenseCategories();
  return <ExpensesClientPage initialExpenses={expenses} initialCategories={categories} />;
}
