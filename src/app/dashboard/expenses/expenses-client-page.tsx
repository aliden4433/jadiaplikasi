
"use client";

import { useState } from "react";
import type { Expense } from "@/lib/types";
import { columns } from "./columns";
import { DataTable } from "@/app/dashboard/products/data-table"; // Re-using the generic data table
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface ExpensesClientPageProps {
  initialExpenses: Expense[];
}

export function ExpensesClientPage({ initialExpenses }: ExpensesClientPageProps) {
  // We can add filtering/sorting state here if needed in the future
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExpenseFormDialog>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        </ExpenseFormDialog>
      </div>
      <DataTable columns={columns} data={initialExpenses} userRole="admin" />
    </div>
  );
}
