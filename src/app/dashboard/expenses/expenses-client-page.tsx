
"use client";

import React from "react";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { getColumns } from "./columns";
import { DataTable } from "@/app/dashboard/products/data-table"; // Re-using the generic data table
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExpensesClientPageProps {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategoryDoc[];
}

export function ExpensesClientPage({ initialExpenses, initialCategories }: ExpensesClientPageProps) {
  const columns = React.useMemo(() => getColumns(initialCategories), [initialCategories]);
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!isMobile && (
            <ExpenseFormDialog categories={initialCategories}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Pengeluaran
            </Button>
            </ExpenseFormDialog>
        )}
      </div>
      <DataTable
        columns={columns}
        data={initialExpenses}
        userRole="admin"
        filterColumnId="description"
        filterPlaceholder="Filter berdasarkan deskripsi..."
        categories={initialCategories}
        entityName="pengeluaran"
      />
       {isMobile && (
         <ExpenseFormDialog categories={initialCategories}>
            <Button
                className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-lg z-20"
                size="icon"
            >
                <PlusCircle className="h-7 w-7" />
                <span className="sr-only">Tambah Pengeluaran</span>
            </Button>
        </ExpenseFormDialog>
      )}
    </div>
  );
}
