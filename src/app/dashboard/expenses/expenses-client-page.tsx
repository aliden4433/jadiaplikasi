
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PlusCircle, Wallet, ChevronLeft, ChevronRight, ReceiptText, TrendingUp } from "lucide-react";
import type { Expense, ExpenseCategoryDoc } from "@/lib/types";
import { getColumns } from "./columns";
import { DataTable } from "@/app/dashboard/products/data-table";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface ExpensesClientPageProps {
  initialExpenses: Expense[];
  initialCategories: ExpenseCategoryDoc[];
}

export function ExpensesClientPage({ initialExpenses, initialCategories }: ExpensesClientPageProps) {
  const { user } = useAuth();
  const userRole = user?.role;
  const columns = React.useMemo(() => getColumns(initialCategories), [initialCategories]);
  const isMobile = useIsMobile();
  const [currentDate, setCurrentDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      if (!prev) return undefined;
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      if (!prev) return undefined;
      const newDate = new Date(prev);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const { monthlyTotal, displayedMonthName, filteredExpenses, expenseCount, averageExpense } = useMemo(() => {
    if (!currentDate) {
        return { monthlyTotal: 0, displayedMonthName: 'Memuat...', filteredExpenses: [], expenseCount: 0, averageExpense: 0 };
    }

    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();
    const displayedMonthName = format(currentDate, "MMMM yyyy", { locale: id });

    const filtered = initialExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth && expenseDate.getFullYear() === selectedYear;
      });

    const total = filtered.reduce((acc, expense) => acc + expense.amount, 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;

    return { monthlyTotal: total, displayedMonthName, filteredExpenses: filtered, expenseCount: count, averageExpense: avg };
  }, [initialExpenses, currentDate]);

  const isNextMonthDisabled = useMemo(() => {
    if (!currentDate) return true;

    const nextMonth = new Date(currentDate);
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const today = new Date();
    today.setDate(1);
    today.setHours(0,0,0,0);
    return nextMonth > today;
  }, [currentDate]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-center text-sm text-muted-foreground pt-1 gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Bulan sebelumnya</span>
            </Button>
            <span className="font-medium text-lg text-foreground w-36 text-center">{displayedMonthName}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNextMonth} disabled={isNextMonthDisabled}>
                <ChevronRight className="h-5 w-5" />
                <span className="sr-only">Bulan berikutnya</span>
            </Button>
        </div>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
             <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(monthlyTotal)}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                  <ReceiptText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {expenseCount}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem className="md:basis-1/2 lg:basis-1/3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rata-Rata Pengeluaran</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                     {formatCurrency(averageExpense)}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
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
        data={filteredExpenses}
        userRole={userRole}
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
