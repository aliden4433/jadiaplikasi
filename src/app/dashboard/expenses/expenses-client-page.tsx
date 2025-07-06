
"use client";

import React, { useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PlusCircle, Wallet } from "lucide-react";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { getColumns } from "./columns";
import { DataTable } from "@/app/dashboard/products/data-table"; // Re-using the generic data table
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpensesClientPageProps {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategoryDoc[];
}

export function ExpensesClientPage({ initialExpenses, initialCategories }: ExpensesClientPageProps) {
  const columns = React.useMemo(() => getColumns(initialCategories), [initialCategories]);
  const isMobile = useIsMobile();

  const { monthlyTotal, currentMonthName } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthName = format(now, "MMMM yyyy", { locale: id });

    const total = initialExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((acc, expense) => acc + expense.amount, 0);

    return { monthlyTotal: total, currentMonthName };
  }, [initialExpenses]);

  return (
    <div className="space-y-4">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran Bulan Ini</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(monthlyTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total untuk bulan {currentMonthName}
            </p>
          </CardContent>
        </Card>
      </div>

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
