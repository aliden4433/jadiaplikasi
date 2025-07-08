
"use server";

import { getSalesHistory } from "../reports/actions";
import { getExpenses } from "../expenses/actions";
import type { ActivityLogItem, Sale, Expense } from "@/lib/types";

// This is a new function to get combined and sorted activity logs
export async function getActivityLog(): Promise<ActivityLogItem[]> {
  const sales = await getSalesHistory();
  const expenses = await getExpenses();

  const saleActivities: ActivityLogItem[] = sales.map((sale: Sale) => ({
    id: sale.id,
    type: "sale",
    date: sale.date,
    description: `Penjualan ${sale.transactionId}`,
    amount: sale.total,
    details: sale,
    // Sales don't have a user attached directly, so we leave it undefined for now
    // This could be enhanced later if needed
  }));

  const expenseActivities: ActivityLogItem[] = expenses.map((expense: Expense) => ({
    id: expense.id,
    type: "expense",
    date: expense.date,
    description: expense.description,
    amount: -expense.amount, // Make expense amount negative
    details: expense,
    user: expense.recordedBy?.email || "N/A",
  }));

  const combinedActivities = [...saleActivities, ...expenseActivities];

  // Sort by date, most recent first
  combinedActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return combinedActivities;
}
