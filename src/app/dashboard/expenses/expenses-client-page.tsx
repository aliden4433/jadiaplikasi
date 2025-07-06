
"use client";

import React from "react";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { getColumns } from "./columns";
import { DataTable } from "@/app/dashboard/products/data-table"; // Re-using the generic data table
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ExpensesClientPageProps {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategoryDoc[];
}

export function ExpensesClientPage({ initialExpenses, initialCategories }: ExpensesClientPageProps) {
  const columns = React.useMemo(() => getColumns(initialCategories), [initialCategories]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExpenseFormDialog categories={initialCategories}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        </ExpenseFormDialog>
      </div>
      <DataTable
        columns={columns}
        data={initialExpenses}
        userRole="admin"
        filterColumnId="description"
        filterPlaceholder="Filter berdasarkan deskripsi..."
      />
    </div>
  );
}
